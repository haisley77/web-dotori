package com.dotori.backend.domain.room.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import javax.persistence.EntityManager;
import javax.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.dotori.backend.domain.book.model.entity.Book;
import com.dotori.backend.domain.member.model.entity.Member;
import com.dotori.backend.domain.room.model.dto.RoomInitializationDto;
import com.dotori.backend.domain.room.model.entity.Room;
import com.dotori.backend.domain.room.model.entity.RoomMember;
import com.dotori.backend.domain.room.repository.RoomRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

import io.openvidu.java.client.Connection;
import io.openvidu.java.client.ConnectionProperties;
import io.openvidu.java.client.OpenVidu;
import io.openvidu.java.client.OpenViduHttpException;
import io.openvidu.java.client.OpenViduJavaClientException;
import io.openvidu.java.client.Session;
import io.openvidu.java.client.SessionProperties;

@Service
@Transactional
public class RoomServiceImpl implements RoomService {

	private final RoomRepository roomRepository;
	// private final BookRepository bookRepository;

	@Autowired
	private EntityManager em;

	private ObjectMapper objectMapper;

	@Autowired
	public RoomServiceImpl(RoomRepository roomRepository
		//, BookRepository bookRepository
	) {
		this.roomRepository = roomRepository;
		// this.bookRepository = bookRepository;
		this.objectMapper = new ObjectMapper();
	}

	@Override
	public Map<String, String> createRoom(OpenVidu openvidu, RoomInitializationDto params) throws Exception {
		Session session = openvidu.createSession(
			SessionProperties.fromJson(params.getSessionProperties()).build());

		if (session == null)
			throw new RuntimeException("세션 생성 중 문제 발생");

		List<RoomMember> roomMembers = new ArrayList<>();

		Book book = Book.builder()
			.title("Example Title")
			.bookImg("exampleProfileImgUrl1")
			.author("Example Author")
			.build();
		em.persist(book);

		Member host = Member.builder()
			.nickname("exampleNickname1")
			.profileImg("exampleProfileImgUrl1")
			.build();
		em.persist(host);

		Room room = Room.builder()
			.book(book)
			.hostId(1L)
			.roomMembers(roomMembers)
			.title("토끼와 거북이 같이 연극해요!")
			.password("1234")
			.limitCnt(4)
			.isPublic(false)
			.sessionId(session.getSessionId())
			.build();
		em.persist(room);
		em.flush();

		// Map<String, Object> roomInfo = objectMapper.readValue((JsonParser)params.getRoomInfo().get("roomInfo"),
		// 	Map.class);

		// Book book = bookRepository.findById(bookId);
		// Member host = memberRepository.findById(roomInfo.get("hostId"));

		// Room room = Room.builder()
		// 	.book(book)
		// 	.hostId(host.getMemberId())
		// 	.roomMembers(roomMembers)
		// 	.title((String)roomInfo.get("title"))
		// 	.password((String)roomInfo.get("password"))
		// 	.isPublic((Boolean)roomInfo.get("isPublic"))
		// 	.sessionId(session.getSessionId())
		// 	.build();

		Connection connection = session.createConnection(
			ConnectionProperties.fromJson(params.getConnectionProperties()).build());
		if (connection == null)
			throw new RuntimeException("토큰 생성 중 문제 발생");

		Map<String, String> resultData = new HashMap<>();
		resultData.put("roomId", String.valueOf(roomRepository.save(room).getRoomId()));
		resultData.put("token", connection.getToken());

		return resultData;
	}

	@Override
	public Session findSessionByRoomId(OpenVidu openvidu, Long roomId) {
		Optional<Room> optionalRoom = roomRepository.findById(roomId);
		if (optionalRoom.isPresent()) {
			return openvidu.getActiveSession(optionalRoom.get().getSessionId());
		}
		throw new RuntimeException("방 조회 불가");
	}

	public List<Room> getAllRooms() {
		return roomRepository.findAll();
	}

	@Override
	public String createConnection(OpenVidu openvidu, Session session,
		Map<String, Object> connectionProperties) throws OpenViduJavaClientException, OpenViduHttpException {
		Connection connection = session.createConnection(
			ConnectionProperties.fromJson(connectionProperties).build());
		if (connection == null)
			throw new RuntimeException("토큰 생성 중 문제 발생");
		return connection.getToken();
	}

	@Override
	public boolean checkJoinPossible(OpenVidu openvidu, Long roomId) {
		// 방 id에 해당하는 방을 가져옵니다.
		Optional<Room> optionalRoom = roomRepository.findById(roomId);
		if (optionalRoom.isEmpty()) {
			throw new RuntimeException("방 조회 불가");
		}
		Room room = optionalRoom.get();
		// 방에 연결된 유효한 connection 리스트를 openvidu 서버에서 불러옵니다.
		List<Connection> activeConnections = openvidu.getActiveSession(room.getSessionId()).getActiveConnections();
		// 유효한 connection 수가 방 제한 인원 수보다 적다면, true를 반환합니다.
		// 사실... connection 된 후 바로 창 나가버리는 경우 생기면 예외 처리해야하는데, 일단은 해피케이스 생각하겠습니다.
		return activeConnections.size() < room.getLimitCnt();
	}

	@Override
	public void addMemberToRoom(Long roomId, Long memberId) {
		// 방 id에 해당하는 방을 가져옵니다.
		Optional<Room> optionalRoom = roomRepository.findById(roomId);
		if (optionalRoom.isEmpty()) {
			throw new RuntimeException("방 조회 불가");
		}
		Room room = optionalRoom.get();

		// Member member = memberRepository.findById(memberId);
		Member member = Member.builder()
			.nickname("도토리유저1")
			.profileImg("프로필이미지")
			.build();

		em.persist(member);
		em.flush();

		// member id에 해당하는 멤버를 방 참여 멤버로 등록합니다.
		RoomMember roomMember = RoomMember.builder()
			.member(member)
			.room(room)
			.build();
		roomRepository.save(roomMember);

		// 방 참여 인원을 갱신합니다.
		room.setJoinCnt(room.getJoinCnt() + 1);
		roomRepository.save(room);
	}

	@Override
	public void removeMemberFromRoom(OpenVidu openvidu, Long roomId, Long memberId) {
		// 방 참여 멤버를 DB에서 지웁니다.
		roomRepository.deleteByRoomMemberId(memberId);

		// 방 id 에 해당하는 방을 가져옵니다.
		Optional<Room> optionalRoom = roomRepository.findById(roomId);
		if (optionalRoom.isEmpty()) {
			throw new RuntimeException("방 조회 불가");
		}
		Room room = optionalRoom.get();
		// 방 참여 인원을 갱신합니다.
		room.setJoinCnt(room.getJoinCnt() - 1);

		// 방에 더이상 남아있는 인원이 없다면 방을 삭제합니다.
		if (room.getJoinCnt() == 0) {
			roomRepository.deleteById(roomId);
		}
	}

}
import {ref} from 'vue';
import {defineStore} from 'pinia';
import {OpenVidu} from 'openvidu-browser';

import {localAxios} from '../axios/http-commons';
import {useRouter} from 'vue-router';

const router = useRouter();
const axios = localAxios();
export const useOpenViduStore
  = defineStore('openViduStore', () => {
  const bookInfoList = ref([{
    'img': 'src/assets/BookImages/img/scene_1.png',
    'lines': ['사회자 : 곤히 코를 골던 사자가 어흥 소리를 지르며 벌떡 일어났어요. ',
      '사회자 : 달리던 생쥐가 잠자는 사자의 코털을 건드렸지요.'],
  }, {
    'img': 'src/assets/BookImages/img/scene_2.png',
    'lines': ['사회자 : 생쥐가 부들부들 떨며 손이 발이 되도록 빌었어요.',
      '생쥐 : 사자님, 제발 살려 주세요! 하늘이 무너져 내려도, 절대 그 은혜를 잊지 않고 꼭 보답하겠어요!',
      '사자 : 후.. 그래. 너같이 작은 것은 먹어도 간에 기별도 안가겠다.'],
  }, {
    'img': 'src/assets/BookImages/img/scene_3.png',
    'lines': ['사회자 : 사자는 생쥐를 그냥 놓아주었어요. ',
      '생쥐 : 감사합니다, 사자님! 이 은혜는 잊지 않을게요!',
      '사회자 : 생쥐는 연방 허리 숙여 감사의 인사를 하고, 수풀 사이로 쪼르르 달아났어요.'],
  }, {
    'img': 'src/assets/BookImages/img/scene_4.png',
    'lines': ['사회자 : 얼마 후, 사자는 숲속을 걷다 사냥꾼들이 설치한 그물에 걸리게 되었어요.',
      '사회자 : 녹초가 되어 발만 꼼지락거리는데, 어디선가 사각사각 사과 씹는 듯한 소리가 들렸어요.'],
  }, {
    'img': 'src/assets/BookImages/img/scene_5.png',
    'lines': ['사회자 : 위에 올라앉은 것은 지난번에 먹는 것도 귀찮아 놓아준 생쥐였어요.',
      '생쥐 : 사자님! 조금만 기다리세요! 제가 구해드릴게요!',
      '사회자 : 생쥐가 죽을힘을 다해 이빨로 그물을 갉았어요.  마침내 그물이 터지고, 사자가 풀려났어요.'],
  }, {
    'img': 'src/assets/BookImages/img/scene_6.png',
    'lines': ['생쥐 : 사자님, 괜찮으세요?',
      '사자 : 안녕, 생쥐야! 무슨 말을 해야 할지 모르겠구나!.',
      '생쥐 : 에이, 그럴 때는 그냥 ‘고마워!’ 하면 되는 거예요!',
      '사자 : 고맙다, 생쥐야. 앞으로는 작다고 무시하지 않을게.',
      '사회자 : 사자는 생쥐에게 진심으로 사과를 했고, 둘은 좋은 친구가 되었답니다.'],
  }]);
  const OV = new OpenVidu();
  const session = OV.initSession();
  const ovToken = ref(null);

  const apiRootPath = '/api/rooms';

  const room_id = ref(0);
  const room_name = ref(null);
  const room_password = ref(null);
  const is_private = ref(false);
  const subscribers = ref([]);
  const mainStreamManager = ref();
  const member_id = ref(40);


  // 방 세션 설정 정보
  const session_properties = ref({});

  // 커넥션 설정 정보
  const connection_properties = ref({});

  // 방 생성 정보
  const room_info = ref({
    hostId: member_id.value,
    title: null,
    password: null,
    isRecording: false,
    joinCnt: 0,
    limitCnt: 0,
    isPublic: true,
  });




  // 방 생성 요청 시 전달할 파라미터
  const roomInitializationParam = ref({
    sessionProperties: null,
    connectionProperties: null,
    roomInfo: null,
    bookInfo: null,
  });


  const createRoom = (bookmodal) => {
    return new Promise((resolve, reject) => {
      const apiPath = apiRootPath + '/session';

      room_info.value.title = room_name.value;
      room_info.value.password = room_password.value;
      room_info.value.isPublic = !is_private;
      room_info.value.limitCnt = bookmodal.roleCnt;

      roomInitializationParam.value.bookInfo = bookmodal;
      roomInitializationParam.value.roomInfo = room_info.value;

      // 방 정보 setting
      if (room_password.value === null && is_private === true) {
        console.log('비밀번호 입력 필수');
        reject('비밀번호 입력 필수'); // Reject the promise with an error message
        return;
      }

      axios.post(apiPath, roomInitializationParam.value)
        .then((response) => {
          console.log(response.status);
          if (response.status === 201) {
            room_id.value = response.data.roomId;
            ovToken.value = response.data.token;

            resolve(response.data); // Resolve the promise with the response data
          }
        })
        .catch((error) => {
          console.error('방 생성 실패 !!');
          console.error(error.response);
          reject(error); // Reject the promise with the error
        });
    });
  };

  const getConnectionToken = () => {
    return new Promise((resolve, reject) => {
      const apiPath = apiRootPath + `/connection/${room_id.value}`;

      axios.post(apiPath, connection_properties.value)
        .then((response) => {
          if (response.status === 200) {
            room_id.value = response.data.roomId;
            ovToken.value = response.data.token;
            resolve(response.data); // Resolve with the response data
          }
          if (response.status === 202) {
            console.log(response.data.message);
            reject(new Error(response.data.message)); // Reject with an error containing the message
          }
        })
        .catch((error) => {
          console.error(error.response);
          console.error('커넥션 생성 실패');
          reject(error); // Reject with the axios error
        });
    });
  };

  const addRoomMember = () => {
    return new Promise((resolve, reject) => {
      const apiPath = apiRootPath + `/add/${room_id.value}/${member_id.value}`;

      axios.post(apiPath)
        .then((response) => {
          if (response.status === 200) {

            resolve(response.data); // Resolve the promise with the response data
          } else if (response.status === 201) {
            console.log('인원 초과로 방 참여 처리 불가');
            reject('인원 초과로 방 참여 처리 불가'); // Reject the promise with an error message
          }
        })
        .catch((error) => {
          console.log(error.response);
          console.error('방 참여 정보 갱신 처리 중 오류 발생');
          reject(error); // Reject the promise with the error
        });
    });
  };

  const removeRoomMember = () => {
    const apiPath = apiRootPath + `/remove/${room_id.value}/${member_id.value}`;

    axios.delete(apiPath)
      .then((response) => {
        if (response.status === 200) {
          console.log('방 나가기 정보 갱신 성공 !!');
          // 페이지 이동
        }
      }).catch((error) => {
      console.error(error.response);
      console.error('방 나가기 정보 갱신 처리 중 오류 발생');
    });

  };

  const connectToOpenVidu = () => {
    return new Promise((resolve, reject) => {
      session.on('streamCreated', ({stream}) => {
        const subscriber = session.subscribe(stream, stream.streamId);
        subscribers.value.push(subscriber);
      });
      //스트림이 사라지면 그 스트림은 구독을 취소한다
      session.on('streamDestroyed', ({stream}) => {
        const index = subscribers.value.indexOf(stream.streamManager, 0);
        if (index >= 0) {
          subscribers.value.splice(index, 1);
        }
      });
      session.connect(ovToken.value)
        .then(() => {
          console.log('ov와 연결 성공!');
          console.log(ovToken.value);
          resolve(); // Resolve the promise on successful connection
        })
        .catch((error) => {
          console.error('ov와 연결 실패:', error);
          reject(error); // Reject the promise with the error on connection failure
        });
    });
  };
  const publish = (publisher) => {
    session.publish(publisher).then(() => {
      mainStreamManager.value = publisher;
      console.log('published my video!');
    }).catch((error) => {
      console.log(error);
    });
  };

  return {
    session,
    room_name,
    room_password,
    is_private,
    ovToken,
    roomInitializationParam,
    createRoom,
    connectToOpenVidu,
    addRoomMember,
    publish,
    subscribers, mainStreamManager, OV,bookInfoList,
  };
}, {persist: {storage: sessionStorage}});

import StorageUtil from './StorageUtil';
import TimeUtil from './TimeUtil';
import Utils from './Utils';
import UserInfoUtil from './UserInfoUtil';

// 会话工具列
export default class ConversationUtil {
  // 获取所有会话，username为null的话是获取所有的会话，username为当前登录用户，可以获取与该用户有关的所有会话
  static getConversations(username, callback) {
    StorageUtil.get('conversations', (error, object) => {
      if (!error && object && object.conversations) {
        let result = object.conversations;
        if (username != null) {
          result = object.conversations.filter(function (con) {
            return Utils.endWith(con.conversationId, username);
          });
        }
        callback && callback(result);
      } else {
        let conversations = [];
        StorageUtil.set('conversations', {'conversations': conversations});
        callback(conversations);
      }
    })
  }

  static getConversation(conversationId, callback) {
    this.getConversations(null, (result) => {
      let conversation = this.isConversationExists(result, conversationId);
      callback(conversation);
    });
  }

  // 判断某个会话是否存在
  static isConversationExists(conversations, conversationId) {
    for (let i = 0; i < conversations.length; i++) {
      if (conversations[i].conversationId == conversationId) {
        return conversations[i];
      }
    }
    return null;
  }

  static showConversations() {
    this.getConversations(null, (result) => {
      console.log('-----------show conversations-----------')
      console.log(result);
      console.log('-----------show conversations-----------')
    })
  }

  // 添加一条message
  static addMessage(message, callback) {
    let conversationId = message.conversationId;
    this.getConversations(null, (result) => {
      let conversation = this.isConversationExists(result, conversationId);
      if (conversation) {
        conversation.messages.push(message);
        conversation.lastTime = TimeUtil.currentTime();
      } else {
        conversation = {
          'conversationId': conversationId,
          'messages': [message],
          'lastTime': TimeUtil.currentTime(),
          'avatar': null
        };
        result.push(conversation);
      }
      result.sort(function (a, b) {
        if (a.lastTime > b.lastTime) {
          return -1;
        } else if (a.lastTime < b.lastTime) {
          return 1;
        }
        return 0;
      });
      StorageUtil.get('username', (error, object) => {
        if (!error && object) {
          let username = object.username;
          let chatWithUsername = message.from;
          if (chatWithUsername == username) {
            chatWithUsername = message.to;
          }
          UserInfoUtil.getUserInfo(chatWithUsername, (userInfo) => {
            if (userInfo != null) {
              conversation['avatar'] = userInfo.avatar;
              conversation['nick'] = userInfo.nick;
            }
            StorageUtil.set('conversations', {'conversations': result}, (error) => {
              callback && callback(error);
            });
          })
        }
      });
    })
  }
}

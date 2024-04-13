var client;
const appVue = new Vue({
    el: "#app",
    data: {
        subscribedTopics: [{ name: 'hello', bubs: [] }],
        newTopic: '',
        activeTp: '',
        messageInput: '',
        ID: ''
    }, methods: {
        addTopic() {
            this.newTopic = prompt("请输入主題");
            this.subscribedTopics.push({ name: this.newTopic, bubs: [] });
            this.activeTp = this.newTopic;
            client.subscribe(this.newTopic);
        }
    }, created() {
        this.activeTp = this.subscribedTopics[0].name;
        fetch('https://ipapi.co/json/')
            .then(response => response.json())
            .then(data => {

                console.log('IP地址:', data.ip);
                console.log('所在城市:', data.city);
                console.log('地区:', data.region);
                console.log('国家:', data.country_name);
                console.log('经纬度:', data.latitude, data.longitude);

                let userName = prompt("请输入昵称");
                this.ID = (userName == "") ? String(data.ip) : userName;
                connectToMQTT(this.ID);
                // showTopicList();
            })
            .catch(error => {
                console.error('获取IP信息失败', error);
            });
    }
})



//侧边栏收起与展开
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const topics = document.querySelectorAll('.topics span');
    const addButton = document.querySelector('.add-topic-btn');

    sidebar.classList.toggle('collapsed');
    topics.forEach(topic => {
        topic.classList.toggle("alpha");
    })
    addButton.classList.toggle("unshown");
}

// 发送消息的函数
function sendMessage() {
    let jsonData = { "ID": appVue.ID, "message": appVue.messageInput };
    let message = new Paho.MQTT.Message(JSON.stringify(jsonData));
    message.destinationName = appVue.activeTp; //订阅的话题
    client.send(message);
    console.log("Message sent: " + appVue.messageInput+" to "+message.destinationName);
}

//MQTT连接函数
function connectToMQTT(ID) {
    client = new Paho.MQTT.Client('118.178.255.236', 8083, ID)
    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;
    client.connect({ onSuccess: onConnect, onFailure: onFailure });
}

// 连接成功的回调函数
function onConnect() {
    console.log('Connected to MQTT server');
    // 订阅话题
    appVue.subscribedTopics.forEach(topic => {
        client.subscribe(topic.name);
    });
}
// 接收到消息的回调函数
function onMessageArrived(message) {
    let receivedData = JSON.parse(message.payloadString);
    console.log('Received message on topic', message.destinationName, ':', receivedData.message);
    // 在页面中显示接收到的消息
    appVue.subscribedTopics.forEach(topic => {
        if (topic.name == message.destinationName)
            topic.bubs.push(JSON.parse(message.payloadString))
    })
    // //处理非展示Topic信息的侧边栏提示
    // if (message.destinationName != appVue.activeTp) {
    //     temTopic = document.getElementById(message.destinationName);
    //     temTopic.classList.add("newMessage");
    //     //很丑的闪烁
    //     setTimeout(() => {
    //         temTopic.classList.toggle("blink");
    //         setTimeout(() => {
    //             temTopic.classList.toggle("blink");
    //             setTimeout(() => {
    //                 temTopic.classList.toggle("blink");
    //                 setTimeout(() => {
    //                     temTopic.classList.toggle("blink");
    //                 }, 200);
    //             }, 200);
    //         }, 200);
    //     }, 200);
    // }
}

// 连接断开的回调函数
function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.log('Connection lost:', responseObject.errorMessage);
    }
    setTimeout(connectToMQTT(appVue.ID), 1000);
}

// 连接失败的回调函数
function onFailure(err) {
    console.log('Failed to connect to MQTT server:', err.errorMessage);
    setTimeout(connectToMQTT(ID), 1000);

}
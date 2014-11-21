function Card(rawCard) {
    var data = rawCard || {};
    this.id = data.id;
    this.priority = data.priority;
    this.name = data.name;
    this.specialist1 = data.specialist1;
    this.time1 = data.time1;
    this.specialist2 = data.specialist2;
    this.time2 = data.time2;
    this.sprint = data.sprint;
}

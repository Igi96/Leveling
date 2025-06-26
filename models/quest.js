class Quest {
        constructor(title, description, stat, xp, userId, statGain = 1) {
                this.id = Date.now();
                this.title = title;
                this.description = description;
                this.stat = stat;
                this.xp = xp;
                this.statGain = statGain;
                this.completed = false;
                this.userId = userId;
}
}


export default Quest;

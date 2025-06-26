class User {
  constructor(name) {
    this.id = crypto.randomUUID();
    this.name = name;
    this.level = 1;
    this.stats = {
      STR: { xp: 0, level: 1 },
      VIT: { xp: 0, level: 1 },
      DEX: { xp: 0, level: 1 },
      INT: { xp: 0, level: 1 },
      WIS: { xp: 0, level: 1 },
      CHA: { xp: 0, level: 1 },
      LUK: { xp: 0, level: 1 }
    };
  }
}


export default User;



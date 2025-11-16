const parametrCrepps = {
    reserv: [WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE],
    base: [
        WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,
        MOVE,MOVE,MOVE,MOVE,
        CARRY,CARRY,CARRY,CARRY
    ],
    hurvester: [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE]
};

const timeLife = 800;

// Экспортим всё одним объектом
module.exports = {
  parametrCrepps,
  timeLife
};
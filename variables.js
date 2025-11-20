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

const isNannyReserveContainer = function(pos, roomName) {
    const nannyReservePositions = [
        { x: 26, y: 23 },
        { x: 27, y: 23 },
        { x: 28, y: 23 }
    ];
    return nannyReservePositions.some(rp => rp.x === pos.x && rp.y === pos.y);
};

// Экспортим всё одним объектом
module.exports = {
  parametrCrepps,
  timeLife,
  isNannyReserveContainer
};
const creepMovement = require('./creepMovement');

let roleLocalMiner = {
    run(creep) {
	// Фиксированная позиция добычи
	const finalPos = new RoomPosition(15, 6, creep.room.name);

	// Идём на позицию
	if (!creep.pos.isEqualTo(finalPos)) {
	    creepMovement.moveTo(creep, finalPos, { range: 0, reusePath: 20 });
	    return;
	}

	// Добываем энергию
	let source = creep.pos.findClosestByRange(FIND_SOURCES);
	if (source) creep.harvest(source);
    }
};

module.exports = roleLocalMiner;

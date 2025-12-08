const creepMovement = require('./creepMovement');

const roleUpdater = {
    run(creep) {
	// Переключение режима работы
	if (creep.store.getUsedCapacity() === 0) {
	    creep.memory.working = false;
	} else if (creep.store.getFreeCapacity() === 0) {
	    creep.memory.working = true;
	}
	creep.upgradeController(creep.room.controller);

	// Сбор энергии
	if (!creep.memory.working) {
	    let target = null;

	    // 1. Ближайший контейнер с энергией
	    target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
		filter: s => s.structureType === STRUCTURE_CONTAINER && s.store.getUsedCapacity(RESOURCE_ENERGY) > 0
	    });

	    // 2. Storage или link
	    if (!target) {
		target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
		    filter: s =>
			(s.structureType === STRUCTURE_STORAGE || s.structureType === STRUCTURE_LINK) &&
			s.store.getUsedCapacity(RESOURCE_ENERGY) > 0
		});
	    }

	    // 3. Если совсем нет — ближайший Source
	    if (!target) {
		target = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
	    }

	    if (target) {
		if (target.store) {
		    if (creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
			creepMovement.moveTo(creep, target, { reusePath: 10 });
		    }
		} else if (target.energy !== undefined) {
		    if (creep.harvest(target) === ERR_NOT_IN_RANGE) {
			creepMovement.moveTo(creep, target, { reusePath: 10 });
		    }
		}
	    }
	    return;
	}

	// Фиксированные позиции для апгрейда контроллера
	const standPositions = [
	    {x: 18, y: 15, roomName: creep.room.name},
	    {x: 19, y: 15, roomName: creep.room.name},
	];

	// Если точка ещё не выбрана
	if (!creep.memory.finalPos) {
	    for (let pos of standPositions) {
		let roomPos = new RoomPosition(pos.x, pos.y, pos.roomName);
		let creepsHere = roomPos.lookFor(LOOK_CREEPS);
		if (creepsHere.length === 0) {
		    creep.memory.finalPos = pos;
		    break;
		}
	    }

	    // Если все точки заняты — ждём
	    if (!creep.memory.finalPos) {
		creep.upgradeController(creep.room.controller);
		return;
	    }
	}

	// Двигаемся к выбранной точке
	const final = new RoomPosition(creep.memory.finalPos.x, creep.memory.finalPos.y, creep.memory.finalPos.roomName);
	if (!creep.pos.isEqualTo(final)) {
	    creepMovement.moveTo(creep, final, { range: 0, reusePath: 10 });
	    return;
	}

	// Апгрейдим контроллер
	if (creep.room.controller) {
	    creep.upgradeController(creep.room.controller);
	}
    }
};

module.exports = roleUpdater;

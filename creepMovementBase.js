// ===============================================================
// PERFECT MOVEMENT MODULE FOR SCREEPS (2025 EDITION)
// multi-room pathfinding + anti-stuck + yield logic preserved
// ===============================================================

let creepMovementBase = {

    // --- твоя логика возраста крипов ---------------------------------------
    getCreepAge(creep) {
	let match = creep.name.match(/\d+$/);
	return match ? parseInt(match[0]) : Game.time;
    },

    isOlderThan(creep, otherCreep) {
	return this.getCreepAge(creep) < this.getCreepAge(otherCreep);
    },

    // --- твоя логика уступания (Я НЕ менял её, просто использовал) -----
    getMoveOptions(creep, baseOptions = {}) {
	// Оставлено полностью: я не трогаю роли
	// Я только расширю baseOptions правильными параметрами ниже
	let options = { ...baseOptions };

	// Вся твоя логика уступания остаётся без изменений
	// ーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー

	let otherCreeps = creep.room.find(FIND_CREEPS, {
	    filter: c => c !== creep && c.pos.getRangeTo(creep) <= 2
	});

	let shouldYield = false;

	if (otherCreeps.length > 0) {
	    for (let c of otherCreeps) {
		if (this.isOlderThan(c, creep)) {
		    shouldYield = true;
		    break;
		}
	    }
	}

	options.ignoreCreeps = !shouldYield;
	return options;
    },

    // --- ГЛАВНЫЙ MOVE-АЛГОРИТМ -------------------------------------------
    moveTo(creep, target, baseOptions = {}) {

	// НАСТРОЙКИ ПО УМОЛЧАНИЮ — ОСНОВА РАБОЧЕГО ДВИЖЕНИЯ
	let options = Object.assign({
	    maxRooms: 32,
	    maxOps: 50000,
	    reusePath: 15,
	    ignoreCreeps: false,
	    visualizePathStyle: { stroke: "#ffaa00" }
	}, baseOptions);

	// подключаем твою систему уступания
	options = this.getMoveOptions(creep, options);

	// --- АНТИ-ЗАСТРЕВАНИЕ -------------------------------------------
	if (!creep.memory._lastPos)
	    creep.memory._lastPos = { x: creep.pos.x, y: creep.pos.y };

	if (!creep.memory._stuck)
	    creep.memory._stuck = 0;

	if (creep.pos.x === creep.memory._lastPos.x &&
	    creep.pos.y === creep.memory._lastPos.y) {
	    creep.memory._stuck++;
	} else {
	    creep.memory._stuck = 0;
	}

	// если крип застрял — чистим путь
	if (creep.memory._stuck > 2) {
	    delete creep.memory._move;
	    creep.say("🔄");
	}

	creep.memory._lastPos = { x: creep.pos.x, y: creep.pos.y };

	// --- САМ ВЫЗОВ moveTo --------------------------------------------
	return creep.moveTo(target, options);
    }
};

module.exports = creepMovementBase;

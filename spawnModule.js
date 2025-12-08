const parametrCrepps = require('./variables');

const spawnModule = {

    /*Game.spawns['Mammy'].spawnCreep(
    	быстро очень больно не живет
    	[
	    MOVE, MOVE, MOVE, MOVE, MOVE,
	    MOVE, MOVE, MOVE, MOVE, MOVE,
	    MOVE, MOVE, MOVE, MOVE, MOVE,
	    ATTACK, ATTACK, ATTACK, ATTACK, ATTACK,
	    ATTACK, ATTACK, ATTACK, ATTACK, ATTACK,
	    ATTACK, ATTACK, ATTACK
    	]
    	быстро но не больно
	[
	    TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,
	    TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,
	    MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,
	    ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,
	    ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK
	],

	[TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH, //больно
	    MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,
	    ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,
	    ATTACK,ATTACK,ATTACK,ATTACK,ATTACK]
    );*/

    spawnAttacker: function(targetRoom, options = {}) {
	let spawn = Game.spawns['Mammy'];
	let energyAvailable = spawn.room.energyAvailable;
	let body = [];

	body.push(...Array(15).fill(MOVE));
	body.push(...Array(15).fill(ATTACK));
	body.push(...Array(20).fill(MOVE));

	/*if (energyAvailable >= 2290) {
	    body = [
		TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
		TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
		TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
		TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
		TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,

		MOVE, MOVE, MOVE, MOVE, MOVE,
		MOVE, MOVE, MOVE, MOVE, MOVE,
		MOVE, MOVE,

		ATTACK, ATTACK, ATTACK, ATTACK, ATTACK,
		ATTACK, ATTACK, ATTACK, ATTACK, ATTACK,
		ATTACK, ATTACK, ATTACK,

	    ];
	} else if (energyAvailable >= 1800) {
	    body = [
		TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
		ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK,
		MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE
	    ];
	} else {
	    body = [
		TOUGH, TOUGH, TOUGH, TOUGH,
		ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK,
		MOVE, MOVE, MOVE, MOVE, MOVE, MOVE
	    ];
	}*/

	let name = 'Attacker_' + spawn.name + '_' + targetRoom + '_' + Game.time;
	let memory = { role: 'attacker', targetRoom, homeRoom: spawn.room.name };
	return spawn.spawnCreep(body, name, { memory });
    }
    ,
    spawnHealer: function(targetRoom, options = {}) {
	let spawn = Game.spawns['Mammy'];
	let energyAvailable = spawn.room.energyAvailable;
	let body = [
	    TOUGH, TOUGH, TOUGH, TOUGH,
	    TOUGH, TOUGH, TOUGH, TOUGH,
	    MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
	    HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL,
	];
/*
	if (energyAvailable >= 2300) {
	    body = [
		TOUGH, TOUGH, TOUGH, TOUGH,
		TOUGH, TOUGH, TOUGH, TOUGH,
		MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
		HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL,
	    ];
	} else if (energyAvailable >= 1800) {
	    body = [
		TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
		HEAL, HEAL, HEAL, HEAL, HEAL, HEAL,
		MOVE, MOVE, MOVE, MOVE, MOVE
	    ];
	} else {
	    body = [
		TOUGH, TOUGH, TOUGH, TOUGH,
		HEAL, HEAL, HEAL,
		MOVE, MOVE, MOVE, MOVE
	    ];
	}*/

	let name = 'Healer_' + spawn.name + '_' + targetRoom + '_' + Game.time;
	let memory = { role: 'healer', targetRoom, homeRoom: spawn.room.name };
	return spawn.spawnCreep(body, name, { memory });
    }
    ,
    spawnRat: function(targetRoom, targetPos) {
	let spawn = Game.spawns['Mammy'];
	if (!spawn) return ERR_INVALID_TARGET;

	if (spawn.room.energyAvailable < 2300) {
	    return ERR_NOT_ENOUGH_ENERGY;
	}

	let body = [];
	body.push(...Array(25).fill(TOUGH));
	body.push(...Array(8).fill(RANGED_ATTACK));
	body.push(...Array(17).fill(MOVE));

	let name = 'Rat_' + spawn.name + '_' + targetRoom + '_' + Game.time;
	let memory = { role: 'rat', targetRoom, homeRoom: spawn.room.name };
	if (targetPos && typeof targetPos.x === 'number' && typeof targetPos.y === 'number') {
	    let target = { x: targetPos.x, y: targetPos.y, roomName: targetPos.roomName || targetRoom };
	    let attack = { x: target.x, y: target.y, roomName: target.roomName };
	    attack.x = Math.max(2, Math.min(47, attack.x));
	    attack.y = Math.max(2, Math.min(47, attack.y));
	    memory.targetPos = target;
	    memory.attackPos = attack;
	}
	return spawn.spawnCreep(body, name, { memory });
    }
    ,
    // Брекер (демонтаж стены) за 1300: 10 MOVE + 8 WORK
    spawnBreaker: function(routeRooms, wallTarget) {
    	let spawn = Game.spawns['Mammy'];
    	let body = [
    	    MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,
    	    WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK
    	];
    	let homeRoom = spawn.room.name;
    	let name = 'Breaker_' + spawn.name + '_' + homeRoom + '_' + Game.time;
    	return spawn.spawnCreep(body, name, { memory: { role: 'attacker', routeRooms, wall: wallTarget } });
    },
    
    // Бурильщик: только WORK + MOVE
    spawnDriller: function() {
    	let spawn = Game.spawns['Mammy'];
    	let body = [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, MOVE, MOVE];
    	let homeRoom = spawn.room.name;
    	let name = 'Driller_' + spawn.name + '_' + homeRoom + '_' + Game.time;
    	return spawn.spawnCreep(body, name, { memory: { role: 'driller' } });
    },
    
    // Мувер за 1300: 10 MOVE + 10 CARRY (быстро собирает и отвозит энергию)
    spawnMover: function() {
    	let spawn = Game.spawns['Mammy'];
    	let body = [
    	    MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,
    	    CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY
    	];
    	let homeRoom = spawn.room.name;
    	let name = 'Mover_' + spawn.name + '_' + homeRoom + '_' + Game.time;
    	return spawn.spawnCreep(body, name, { memory: { role: 'mover' } });
    },

    // Claimer за 650: 5 MOVE + 1 CLAIM (захватывает контроллер)
    spawnClaimer: function(targetRoom) {
    	let spawn = Game.spawns['Mammy'];
    	let body = [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CLAIM, CLAIM, CLAIM, CLAIM, CLAIM, CLAIM, CLAIM, CLAIM, CLAIM, CLAIM, CLAIM, CLAIM, CLAIM, CLAIM, CLAIM];
    	let name = 'Claimer_' + spawn.name + '_' + targetRoom + '_' + Game.time;
    	return spawn.spawnCreep(body, name, { memory: { role: 'claimer', targetRoom } });
    },

    spawnAssaultMelee: function(targetRoom, options = {}) {
	let spawn = Game.spawns['Mammy'];
	if (!spawn) return ERR_INVALID_TARGET;
	if (spawn.room.energyAvailable < 2300) return ERR_NOT_ENOUGH_ENERGY;

	let body = [];
	body.push(...Array(25).fill(TOUGH));
	body.push(...Array(10).fill(MOVE));
	body.push(...Array(15).fill(ATTACK));

	let name = 'AssaultMelee_' + spawn.name + '_' + targetRoom + '_' + Game.time;
	let memory = { role: 'assaultMelee', targetRoom, homeRoom: spawn.room.name };
	if (options.assaultSquadId) memory.assaultSquadId = options.assaultSquadId;
	if (options.route) memory.route = options.route.slice();
	return spawn.spawnCreep(body, name, { memory });
    },

    spawnAssaultRanged: function(targetRoom, options = {}) {
	let spawn = Game.spawns['Mammy'];
	if (!spawn) return ERR_INVALID_TARGET;
	if (spawn.room.energyAvailable < 2300) return ERR_NOT_ENOUGH_ENERGY;

	let body = [];
	body.push(...Array(6).fill(TOUGH));
	body.push(...Array(10).fill(MOVE));
	body.push(...Array(10).fill(RANGED_ATTACK));

	let name = 'AssaultRanged_' + spawn.name + '_' + targetRoom + '_' + Game.time;
	let memory = { role: 'assaultRanged', targetRoom, homeRoom: spawn.room.name };
	if (options.assaultSquadId) memory.assaultSquadId = options.assaultSquadId;
	if (options.route) memory.route = options.route.slice();
	return spawn.spawnCreep(body, name, { memory });
    },

    spawnAssaultHealer: function(targetRoom, options = {}) {
	let spawn = Game.spawns['Mammy'];
	if (!spawn) return ERR_INVALID_TARGET;
	if (spawn.room.energyAvailable < 2300) return ERR_NOT_ENOUGH_ENERGY;

	let body = [];
	body.push(...Array(6).fill(TOUGH));
	body.push(...Array(10).fill(MOVE));
	body.push(...Array(6).fill(HEAL));

	let name = 'AssaultHealer_' + spawn.name + '_' + targetRoom + '_' + Game.time;
	let memory = { role: 'assaultHealer', targetRoom, homeRoom: spawn.room.name };
	if (options.assaultSquadId) memory.assaultSquadId = options.assaultSquadId;
	if (options.route) memory.route = options.route.slice();
	return spawn.spawnCreep(body, name, { memory });
    },

    spawnPatrol: function(patrolPos) {
	let spawn = Game.spawns['Mammy'];
	if (!spawn) return ERR_INVALID_TARGET;

	let body = [];
	body.push(...Array(30).fill(MOVE));
	body.push(...Array(5).fill(RANGED_ATTACK));

	let targetRoom = patrolPos.roomName || spawn.room.name;
	let name = 'Patrol_' + spawn.name + '_' + targetRoom + '_' + Game.time;
	let memory = { role: 'patrol', patrolPos, homeRoom: spawn.room.name };
	return spawn.spawnCreep(body, name, { memory });
    }

};

module.exports = spawnModule;
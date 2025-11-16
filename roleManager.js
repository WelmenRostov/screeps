const {parametrCrepps, timeLife} = require('./variables');
const spawnModule = require('./spawnModule');
let roleManager = {
    tick: function() {
        let spawn = Game.spawns['Mammy'];

        /*const minRoles = { оптимал
            builder: 1,
            driller: 1,
            mover: 2,
            filler: 0,
            updater: 1,
            invader: 0,
            remoteMiner: 2,
            remoteHauler: 1,
        };*/

        const PATROL_POS = {x: 26, y: 24, roomName: 'W20N57'};

        const minRoles = {
            builder: 1,
            driller: 1,
            mover: 1,
            filler: 0,
            updater: 2,
            invader: 0,
            remoteMiner: 0,
            remoteHauler: 1,
            patrol: 0,
        };

        const targetRoom = 'W22N56';
        let hasEnemies = false;
        let enemyRoom = null;
        if (Game.rooms[targetRoom]) {
            let enemies = Game.rooms[targetRoom].find(FIND_HOSTILE_CREEPS);
            if (enemies.length > 0) {
                hasEnemies = true;
                enemyRoom = targetRoom;
            }
        }

        const allCreeps = Object.values(Game.creeps);
        const roleSum = {
            builder: 0,
            driller: 0,
            mover: 0,
            filler: 0,
            updater: 0,
            invader: 0,
            remoteMiner: 0,
            remoteHauler: 0,
            attacker: 0,
            patrol: 0
        };
        for (let c of allCreeps) {
            if (roleSum.hasOwnProperty(c.memory.role) && c.ticksToLive) {
                roleSum[c.memory.role] += c.ticksToLive;
            }
        }

        if (hasEnemies && enemyRoom && roleSum.attacker === 0 && !spawn.spawning) {
            spawnModule.spawnAttacker(enemyRoom);
            return;
        }

        // Спавним если суммарная жизнь ниже порога
        if (roleSum.builder < minRoles.builder * 1 && !spawn.spawning) {
            this.spawnBuilder();
        }
        if (roleSum.driller < minRoles.driller * 100 && !spawn.spawning) {
            this.spawnDriller();
        }
        if (roleSum.mover < minRoles.mover * 650 && !spawn.spawning) {
            this.spawnMover();
        }
        const fillerSourceRoom = 'W23N56';
        const fillerTargetRoom = 'W23N57';
        
        if (roleSum.filler < minRoles.filler * 100 && !spawn.spawning) {
            this.spawnFiller(fillerSourceRoom, fillerTargetRoom);
        }
        if (roleSum.updater < minRoles.updater * 600 && !spawn.spawning) {
            this.spawnUpdater();
        }
        if (roleSum.invader < minRoles.invader * 10 && !spawn.spawning) {
            this.spawnInvader();
        }
        if (roleSum.remoteMiner < minRoles.remoteMiner * 500 && !spawn.spawning) { // при timeLife все ок
            this.spawnRemoteMiner('W23N56');
        }
        if (roleSum.remoteHauler < minRoles.remoteHauler * 1 && !spawn.spawning) { // при 500 все ок
            this.spawnRemoteHauler('W23N56', {x: 29, y: 48, roomName: spawn.room.name});
        }
        if (roleSum.patrol < minRoles.patrol * 600 && !spawn.spawning) {
            this.spawnPatrol(PATROL_POS);
        }
    },

    spawnBuilder: function() {
    let spawn = Game.spawns['Mammy'];
    let name = 'builder' + Game.time;
    let result = spawn.spawnCreep(parametrCrepps.base, name, { memory: { role: 'builder' } });
    if (result === ERR_NOT_ENOUGH_ENERGY) {
        spawn.spawnCreep([
            WORK,WORK,WORK,WORK,WORK,WORK,
            MOVE,MOVE,MOVE,
            CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,
            CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,
        ], name, { memory: { role: 'builder' } });
    }
    },



    spawnDriller: function() {
	let spawn = Game.spawns['Mammy'];
	let body = [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, MOVE, MOVE];
	let name = 'driller' + Game.time;
	return spawn.spawnCreep(body, name, { memory: { role: 'driller' } });
    },

    spawnMover: function() {
	let spawn = Game.spawns['Mammy'];
        let body = [
            MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,
            MOVE,MOVE,MOVE,MOVE,
            CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,
            CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,
            CARRY,CARRY,CARRY,CARRY
        ];
	let name = 'mover' + Game.time;
	return spawn.spawnCreep(body, name, { memory: { role: 'mover' } });
    },

    spawnFiller: function(sourceRoom, targetRoom) {
        let spawn = Game.spawns['Mammy'];
        let body = [
            MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,
            CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,
        ];
        let name = 'filler' + Game.time;
        return spawn.spawnCreep(body, name, { memory: { role: 'filler', sourceRoom, targetRoom } });
    },

    spawnUpdater: function() {
	let spawn = Game.spawns['Mammy'];
	// Максимально эффективный улучшатель за 1300 энергии: 13 WORK + 13 MOVE + 2 CARRY
	let body = [
	    WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,
            MOVE,MOVE,MOVE,MOVE,MOVE,
	    CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY
	];
	let name = 'updater' + Game.time;
	return spawn.spawnCreep(body, name, { memory: { role: 'updater' } });
    },

    spawnInvader: function() {
	let spawn = Game.spawns['Mammy'];
	// Строитель захватчик за 1300 энергии: 10 WORK + 10 MOVE + 10 CARRY
	let body = [
	    WORK,WORK,WORK,WORK,WORK,WORK,
	    MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,
	    CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,
	];
	let name = 'invader' + Game.time;
	return spawn.spawnCreep(body, name, { memory: { role: 'invader', homeRoom: spawn.room.name } });
    }
    ,

    spawnRemoteMiner: function(targetRoom) {
        let spawn = Game.spawns['Mammy'];
        let body = [
            WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,
            MOVE,MOVE,MOVE,MOVE,
        ];
        let name = 'remoteMiner' + Game.time;
        return spawn.spawnCreep(body, name, { memory: { role: 'remoteMiner', targetRoom } });
    }
    ,

    spawnRemoteHauler: function(targetRoom, homeLinkPos) {
        let spawn = Game.spawns['Mammy'];
        let body = [
            MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,
            CARRY,CARRY,
            CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY
        ];
        let name = 'remoteHauler' + Game.time;
        return spawn.spawnCreep(body, name, { memory: { role: 'remoteHauler', targetRoom, homeLinkPos } });
    },

    spawnPatrol: function(patrolPos) {
        return spawnModule.spawnPatrol(patrolPos);
    }
};

module.exports = roleManager;

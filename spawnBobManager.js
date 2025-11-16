const { timeLife } = require('./variables');

let spawnBobManager = {
    tick: function() {
        let spawn = Game.spawns['Bob'];
        if (!spawn || spawn.spawning) return;

        const remoteTargetRoom = 'W22N56';
        const remotePositions = [
            { x: 19, y: 41, roomName: remoteTargetRoom },
            { x: 40, y: 41, roomName: remoteTargetRoom }
        ];

        const minRoles = {
            bobHarvester: 1,
            bobRepairer: 1,
            bobMover: 3,
            bobHelper: 0,
            bobMiner: 1,
            bobInvader: 1,
            bobRemoteMiner: 1,
            bobRemoteHauler: 2,
            bobReserver: 1,
            bobAttacker: 1,
        };

        const roleSum = {
            bobHarvester: 0,
            bobRepairer: 0,
            bobMover: 0,
            bobHelper: 0,
            bobMiner: 0,
            bobInvader: 0,
            bobRemoteMiner: 0,
            bobRemoteHauler: 0,
            bobReserver: 0,
            bobAttacker: 0
        };

        const allCreeps = Object.values(Game.creeps);
        for (let c of allCreeps) {
            if (roleSum.hasOwnProperty(c.memory.role) && c.ticksToLive) {
                roleSum[c.memory.role] += c.ticksToLive;
            }
        }

        let hasEnemies = false;
        let enemyRoom = null;
        if (Game.rooms[remoteTargetRoom]) {
            let enemies = Game.rooms[remoteTargetRoom].find(FIND_HOSTILE_CREEPS);
            if (enemies.length > 0) {
                hasEnemies = true;
                enemyRoom = remoteTargetRoom;
            }
        }

        const hasAttacker = allCreeps.some(c => c.memory.role === 'bobAttacker');
        if (hasEnemies && enemyRoom && !hasAttacker) {
            if (!spawn.spawning) {
                if (this.spawnBobAttacker(enemyRoom) === OK) return;
            }
            return;
        }

        let mammySpawn = Game.spawns['Mammy'];
        let mammyHasProblems = false;
        if (mammySpawn) {
            if (mammySpawn.spawning) {
                mammyHasProblems = true;
            } else {
                const mammyRoom = mammySpawn.room;
                let mammyMoverSum = 0;
                for (let c of allCreeps) {
                    if (c.memory.role === 'mover' && c.room && c.room.name === mammyRoom.name && c.ticksToLive) {
                        mammyMoverSum += c.ticksToLive;
                    }
                }
                if (mammyMoverSum < timeLife) {
                    mammyHasProblems = true;
                }
            }
        }

        if (mammyHasProblems && roleSum.bobHelper < minRoles.bobHelper * timeLife) {
            if (this.spawnHelper() === OK) return;
        }

        if (roleSum.bobMover < minRoles.bobMover * 800 && !spawn.spawning) {
            if (this.spawnMover() === OK) return;
        }

        if (roleSum.bobMiner < minRoles.bobMiner * 990 && !spawn.spawning) {
            if (this.spawnMiner() === OK) return;
        }

        if (roleSum.bobHarvester < minRoles.bobHarvester * 100 && !spawn.spawning) {
            if (this.spawnHarvester() === OK) return;
        }

        if (roleSum.bobRepairer < minRoles.bobRepairer * 300 && !spawn.spawning) {
            if (this.spawnRepairer() === OK) return;
        }

        if (roleSum.bobInvader < minRoles.bobInvader * 1 && !spawn.spawning) {
            if (this.spawnInvader() === OK) return;
        }

        if (roleSum.bobRemoteMiner < minRoles.bobRemoteMiner * 1400 && !spawn.spawning) {
            if (this.spawnRemoteMiner(remoteTargetRoom, remotePositions) === OK) return;
        }

        if (roleSum.bobRemoteHauler < minRoles.bobRemoteHauler * 1400 && !spawn.spawning) {
            if (this.spawnRemoteHauler(remoteTargetRoom) === OK) return;
        }

        if (roleSum.bobReserver < minRoles.bobReserver * 200 && !spawn.spawning) {
            if (this.spawnReserver(remoteTargetRoom) === OK) return;
        }
    },

    spawnHarvester: function() {
        let spawn = Game.spawns['Bob'];
        if (!spawn) return ERR_INVALID_TARGET;

        let body = [
            WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
            CARRY, CARRY, CARRY, CARRY,
            MOVE, ];

        let energyAvailable = spawn.room.energyAvailable;

        let name = 'bobHarvester' + Game.time;
        return spawn.spawnCreep(body, name, { memory: { role: 'bobHarvester' } });
    },

    spawnRepairer: function() {
        let spawn = Game.spawns['Bob'];
        if (!spawn) return ERR_INVALID_TARGET;

        let body = [
            WORK, WORK, WORK, WORK, WORK,
            CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
            MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,];

        let name = 'bobRepairer' + Game.time;
        return spawn.spawnCreep(body, name, { memory: { role: 'bobRepairer' } });
    },

    spawnMover: function() {
        let spawn = Game.spawns['Bob'];
        if (!spawn) return ERR_INVALID_TARGET;

        let body = [
            MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
            CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
            CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
        ];

        let name = 'bobMover' + Game.time;
        return spawn.spawnCreep(body, name, { memory: { role: 'bobMover' } });
    },

    spawnHelper: function() {
        let spawn = Game.spawns['Bob'];
        if (!spawn) return ERR_INVALID_TARGET;

        let energyAvailable = spawn.room.energyAvailable;
        let body = [
            MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
            CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
        ];

        if (energyAvailable < 800) {
            body = [
                MOVE, CARRY, CARRY, CARRY, CARRY
            ];
        }

        let name = 'bobHelper' + Game.time;
        return spawn.spawnCreep(body, name, { memory: { role: 'bobHelper' } });
    },

    spawnMiner: function() {
        let spawn = Game.spawns['Bob'];
        if (!spawn) return ERR_INVALID_TARGET;
        let body = [
            WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
            MOVE, MOVE, MOVE, MOVE
        ];

        let name = 'bobMiner' + Game.time;
        return spawn.spawnCreep(body, name, { memory: { role: 'bobMiner' } });
    },

    spawnInvader: function() {
        let spawn = Game.spawns['Bob'];
        if (!spawn) return ERR_INVALID_TARGET;
        let body = [
            WORK, WORK, WORK, WORK, WORK, WORK,
            MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
            CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
        ];
        let name = 'bobInvader' + Game.time;
        return spawn.spawnCreep(body, name, { memory: { role: 'bobInvader', homeRoom: spawn.room.name, targetRoom: 'W22N56' } });
    },

    spawnRemoteMiner: function(targetRoom, fixedPositions) {
        let spawn = Game.spawns['Bob'];
        if (!spawn) return ERR_INVALID_TARGET;
        let body = [
            WORK, WORK, WORK, WORK, WORK, WORK, WORK,
            MOVE, MOVE, MOVE,
        ];
        let name = 'bobRemoteMiner' + Game.time;
        return spawn.spawnCreep(body, name, {
            memory: {
                role: 'bobRemoteMiner',
                targetRoom,
                fixedPositions
            }
        });
    },

    spawnRemoteHauler: function(targetRoom) {
        let spawn = Game.spawns['Bob'];
        if (!spawn) return ERR_INVALID_TARGET;
        let body = [
            MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
            CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
            CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
        ];
        let name = 'bobRemoteHauler' + Game.time;
        return spawn.spawnCreep(body, name, {
            memory: {
                role: 'bobRemoteHauler',
                targetRoom,
                homeRoom: spawn.room.name
            }
        });
    },

    spawnReserver: function(targetRoom) {
        let spawn = Game.spawns['Bob'];
        if (!spawn) return ERR_INVALID_TARGET;
        let body = [CLAIM, MOVE, MOVE];
        let name = 'bobReserver' + Game.time;
        return spawn.spawnCreep(body, name, {
            memory: {
                role: 'bobReserver',
                targetRoom
            }
        });
    },

    spawnBobAttacker: function(targetRoom) {
        let spawn = Game.spawns['Bob'];
        if (!spawn) return ERR_INVALID_TARGET;
        let body = [
            TOUGH, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
            ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK
        ];
        let name = 'bobAttacker' + Game.time;
        return spawn.spawnCreep(body, name, {
            memory: {
                role: 'bobAttacker',
                homeRoom: spawn.room.name,
                targetRoom
            }
        });
    }
};

module.exports = spawnBobManager;

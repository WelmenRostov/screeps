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
            bobNanny: 2,
            bobMover: 4,
            bobHelper: 0,
            bobMiner: 1,
            bobHarvester: 1,
            bobRepairer: 0,
            bobInvader: 0,
            bobRemoteMiner: 0,
            bobRemoteHauler: 0,
            bobReserver: 0,
            bobAttacker: 0,
            bobInvader24: 0,
            bobHealer: 0,
            bobRemoteMiner24: 0,
            bobRemoteHauler24: 0,
        };

        const roleSum = {
            bobHarvester: 0,
            bobRepairer: 0,
            bobMover: 0,
            bobHelper: 0,
            bobMiner: 0,
            bobNanny: 0,
            bobInvader: 0,
            bobRemoteMiner: 0,
            bobRemoteHauler: 0,
            bobReserver: 0,
            bobAttacker: 0,
            bobHealer: 0,
            bobInvader24: 0,
            bobRemoteMiner24: 0,
            bobRemoteHauler24: 0
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

        if (roleSum.bobNanny < minRoles.bobNanny * 600 && !spawn.spawning) {
            if (this.spawnNanny() === OK) return;
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

        if (roleSum.bobInvader24 < minRoles.bobInvader24 * 60 && !spawn.spawning) {
            if (this.spawnInvader24() === OK) return;
        }

        if (roleSum.bobRepairer < minRoles.bobRepairer * 300 && !spawn.spawning) {
            if (this.spawnRepairer() === OK) return;
        }

        if (roleSum.bobInvader < minRoles.bobInvader * 1 && !spawn.spawning) {
            if (this.spawnInvader() === OK) return;
        }


        if (roleSum.bobRemoteMiner24 < minRoles.bobRemoteMiner24 * 600 && !spawn.spawning) {
            if (this.spawnRemoteMiner24('W24N56', remotePositions) === OK) return;
        }

        if (roleSum.bobRemoteMiner < minRoles.bobRemoteMiner * 200 && !spawn.spawning) {
            if (this.spawnRemoteMiner(remoteTargetRoom, remotePositions) === OK) return;
        }

        if (roleSum.bobRemoteHauler24 < minRoles.bobRemoteHauler24 * 600 && !spawn.spawning) {
            if (this.spawnRemoteHauler24('W24N56') === OK) return;
        }

        if (roleSum.bobRemoteHauler < minRoles.bobRemoteHauler * 1400 && !spawn.spawning) {
            if (this.spawnRemoteHauler(remoteTargetRoom) === OK) return;
        }


        if (roleSum.bobReserver < minRoles.bobReserver * 200 && !spawn.spawning) {
            if (this.spawnReserver(remoteTargetRoom) === OK) return;
        }

        if (roleSum.bobHealer < minRoles.bobHealer * 1500 && !spawn.spawning) {
            if (this.spawnHealer() === OK) return;
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
        let homeRoom = spawn.room.name;

        let name = 'Harvester_' + spawn.name + '_' + homeRoom + '_' + Game.time;
        return spawn.spawnCreep(body, name, { memory: { role: 'bobHarvester' } });
    },

    spawnRepairer: function() {
        let spawn = Game.spawns['Bob'];
        if (!spawn) return ERR_INVALID_TARGET;

        let body = [
            WORK, WORK, WORK, WORK, WORK,
            CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
            MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,];

        let homeRoom = spawn.room.name;
        let name = 'Repairer_' + spawn.name + '_' + homeRoom + '_' + Game.time;
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

        let homeRoom = spawn.room.name;
        let name = 'Mover_' + spawn.name + '_' + homeRoom + '_' + Game.time;
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

        let homeRoom = spawn.room.name;
        let name = 'Helper_' + spawn.name + '_' + homeRoom + '_' + Game.time;
        return spawn.spawnCreep(body, name, { memory: { role: 'bobHelper' } });
    },

    spawnMiner: function() {
        let spawn = Game.spawns['Bob'];
        if (!spawn) return ERR_INVALID_TARGET;
        let body = [
            WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
            MOVE, MOVE, MOVE, MOVE
        ];

        let homeRoom = spawn.room.name;
        let name = 'Miner_' + spawn.name + '_' + homeRoom + '_' + Game.time;
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
        let targetRoom = 'W22N56';
        let name = 'Invader_' + spawn.name + '_' + targetRoom + '_' + Game.time;
        return spawn.spawnCreep(body, name, { memory: { role: 'bobInvader', homeRoom: spawn.room.name, targetRoom } });
    },

    spawnInvader24: function() {
        let spawn = Game.spawns['Bob'];
        if (!spawn) return ERR_INVALID_TARGET;
        let body = [
            WORK, WORK, WORK, WORK, WORK, WORK,
            MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
            CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
        ];
        let targetRoom = 'W24N56';
        let name = 'Invader_' + spawn.name + '_' + targetRoom + '_' + Game.time;
        return spawn.spawnCreep(body, name, { memory: { role: 'bobInvader24', homeRoom: spawn.room.name, targetRoom } });
    },

    spawnRemoteMiner: function(targetRoom, fixedPositions) {
        let spawn = Game.spawns['Bob'];
        if (!spawn) return ERR_INVALID_TARGET;
        let body = [
            WORK, WORK, WORK, WORK, WORK, WORK, WORK,
            MOVE, MOVE, MOVE,
        ];
        let name = 'RemoteMiner_' + spawn.name + '_' + targetRoom + '_' + Game.time;
        return spawn.spawnCreep(body, name, {
            memory: {
                role: 'bobRemoteMiner',
                targetRoom,
                fixedPositions
            }
        });
    },

    spawnRemoteMiner24: function(targetRoom, fixedPositions) {
        let spawn = Game.spawns['Bob'];
        if (!spawn) return ERR_INVALID_TARGET;
        let body = [
            WORK, WORK, WORK, WORK, WORK, WORK, WORK,
            MOVE, MOVE, MOVE,
        ];
        let name = 'RemoteMiner_' + spawn.name + '_' + targetRoom + '_' + Game.time;
        return spawn.spawnCreep(body, name, {
            memory: {
                role: 'bobRemoteMiner24',
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
        let name = 'RemoteHauler_' + spawn.name + '_' + targetRoom + '_' + Game.time;
        return spawn.spawnCreep(body, name, {
            memory: {
                role: 'bobRemoteHauler',
                targetRoom,
                homeRoom: spawn.room.name
            }
        });
    },

    spawnRemoteHauler24: function(targetRoom) {
        let spawn = Game.spawns['Bob'];
        if (!spawn) return ERR_INVALID_TARGET;
        let body = [
            MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
            CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
            CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
        ];
        let name = 'RemoteHauler_' + spawn.name + '_' + targetRoom + '_' + Game.time;
        return spawn.spawnCreep(body, name, {
            memory: {
                role: 'bobRemoteHauler24',
                targetRoom,
                homeRoom: spawn.room.name
            }
        });
    },

    spawnReserver: function(targetRoom) {
        let spawn = Game.spawns['Bob'];
        if (!spawn) return ERR_INVALID_TARGET;
        let body = [CLAIM, MOVE, MOVE];
        let name = 'Reserver_' + spawn.name + '_' + targetRoom + '_' + Game.time;
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
        let name = 'Attacker_' + spawn.name + '_' + targetRoom + '_' + Game.time;
        return spawn.spawnCreep(body, name, {
            memory: {
                role: 'bobAttacker',
                homeRoom: spawn.room.name,
                targetRoom
            }
        });
    },

    spawnHealer: function() {
        let spawn = Game.spawns['Bob'];
        if (!spawn) return ERR_INVALID_TARGET;
        let body = [
            MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
            MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
            MOVE,
            HEAL, HEAL, HEAL
        ];
        let targetRoom = 'W24N56';
        let name = 'Healer_' + spawn.name + '_' + targetRoom + '_' + Game.time;
        return spawn.spawnCreep(body, name, {
            memory: {
                role: 'bobHealer',
                homeRoom: spawn.room.name,
                targetRoom
            }
        });
    },

    spawnNanny: function() {
        let spawn = Game.spawns['Bob'];
        if (!spawn) return ERR_INVALID_TARGET;
        let body = [
            MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
            CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
            CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
        ];
        let homeRoom = spawn.room.name;
        let name = 'Nanny_' + spawn.name + '_' + homeRoom + '_' + Game.time;
        return spawn.spawnCreep(body, name, {
            memory: {
                role: 'bobNanny',
                homeRoom: homeRoom
            }
        });
    }
};

module.exports = spawnBobManager;

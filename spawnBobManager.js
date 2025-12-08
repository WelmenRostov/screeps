const { timeLife } = require('./variables');

let spawnBobManager = {
    tick: function() {
        let spawn = Game.spawns['Bob'];
        if (!spawn || spawn.spawning) return;

        const remoteTargetRoom = 'W22N55';
        const remoteTargetRoom2 = 'W19N55';
        const remotePositions = [
            { x: 19, y: 41, roomName: remoteTargetRoom },
            { x: 40, y: 41, roomName: remoteTargetRoom }
        ];

        const minRoles = {
            bobNanny: 700,
            bobLocalMiner: 950,
            bobMover: 1200,


            bobRemoteHauler: 0,
            bobHarvester: 100,
            bobRepairer: 1,

            //Блок захвата
            bobRemoteHaulerW24N56: 3500, //2500
            bobRemoteMinerW24N56: 2000, //2000
            bobInvaderW24N56: 100, //100

            bobReserver: 0,
            bobInvader: 0,



            mammyHealer: 0, //1200 норм
            mammyRanged: 0, //2200 норм

           /*
            bobRemoteHaulerW24N56: 1,
            bobHealer: 1,
            bobRemoteMinerW24N56: 2,
            bobRemoteHaulerW24N56: 1,
            bobHelper: 0,
            bobInvader: 0,
            bobRemoteMiner: 0,
            bobReserver: 0
            */
        };

        const roleSum = {

            bobNanny: 0,
            bobLocalMiner: 0,
            bobHarvester: 0,
            bobRepairer: 0,
            bobMover: 0,
            bobHelper: 0,
            bobInvader: 0,
            bobRemoteMiner: 0,
            bobRemoteMinerW24N56: 0,
            bobRemoteHauler: 0,
            bobRemoteHaulerW24N56: 0,
            bobReserver: 0,
            bobHealer: 0,
            bobInvaderW24N56: 0,
            mammyHealer: 0,
            mammyRanged: 0,
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
        /*==========================================================*/
        if (roleSum.bobNanny < minRoles.bobNanny && !spawn.spawning) {
            if (this.spawnNanny() === OK) return;
        }

        if (roleSum.mammyRanged < minRoles.mammyRanged  ){
            if (this.spawnMammyRanged() === OK) return;
        }
        if (roleSum.mammyHealer < minRoles.mammyHealer  ){
            if (this.spawnMammyHealer() === OK) return;
        }

        let hasNanny = roleSum.bobNanny >= minRoles.bobNanny;

        if (hasNanny) {

            if (roleSum.bobLocalMiner < minRoles.bobLocalMiner && !spawn.spawning) {
                if (this.spawnMiner() === OK) return;
            }

            let hasLocalMiner = roleSum.bobLocalMiner >= minRoles.bobLocalMiner;

            if (hasLocalMiner) {

                if (roleSum.bobMover < minRoles.bobMover && !spawn.spawning) {
                    if (this.spawnMover() === OK) return;
                }

                let hasMover = roleSum.bobMover >= minRoles.bobMover;

                if (hasMover) {

                    if (roleSum.bobRemoteMinerW24N56 < minRoles.bobRemoteMinerW24N56 && !spawn.spawning) {
                        if (this.spawnRemoteMinerW24N56('W24N56', remotePositions) === OK) return;
                    }

                    let hasRemoteMinerW24N56 = roleSum.bobRemoteMinerW24N56 >= minRoles.bobRemoteMinerW24N56;

                    if (hasRemoteMinerW24N56) {
                        if (roleSum.bobInvaderW24N56 < minRoles.bobInvaderW24N56 && !spawn.spawning) {
                            if (this.spawnInvaderW24N56() === OK) return;
                        }

                        let hasInvaderW24N56 = roleSum.bobInvaderW24N56 >= minRoles.bobInvaderW24N56;

                        if (hasInvaderW24N56) {
                            if (roleSum.bobRemoteHaulerW24N56 < minRoles.bobRemoteHaulerW24N56 && !spawn.spawning) {
                                if (this.spawnRemoteHaulerW24N56('W24N56') === OK) return;
                            }

                            if (roleSum.bobHarvester <  minRoles.bobHarvester && !spawn.spawning) {
                                if (this.spawnHarvester() === OK) return;
                            }

                            if (roleSum.bobRepairer < minRoles.bobRepairer && !spawn.spawning) {
                                if (this.spawnRepairer() === OK) return;
                            }

                            if (roleSum.bobHealer < (minRoles.bobHealer || 0) * 400 && !spawn.spawning) {
                                if (this.spawnHealer() === OK) return;
                            }

                            if (mammyHasProblems && roleSum.bobHelper < (minRoles.bobHelper || 0) * timeLife && !spawn.spawning) {
                                if (this.spawnHelper() === OK) return;
                            }

                            if (roleSum.bobInvader < minRoles.bobInvader && !spawn.spawning) {
                                if (this.spawnInvader() === OK) return;
                            }

                            if (roleSum.bobRemoteMiner < (minRoles.bobRemoteMiner || 0) * 200 && !spawn.spawning) {
                                if (this.spawnRemoteMiner(remoteTargetRoom, remotePositions) === OK) return;
                            }

                            if (roleSum.bobRemoteHauler < (minRoles.bobRemoteHauler || 0) * 600 && !spawn.spawning) {
                                if (this.spawnRemoteHauler(remoteTargetRoom) === OK) return;
                            }

                            if (roleSum.bobReserver < minRoles.bobReserver && !spawn.spawning){
                                if (this.spawnReserver(remoteTargetRoom) === OK) return;
                            }
                        }
                    }
                }
            }
        }

        if (!spawn.spawning) {
            let needsSpawn = false;
            let hasNanny = roleSum.bobNanny >= minRoles.bobNanny;
            let hasLocalMiner = hasNanny && roleSum.bobLocalMiner >= minRoles.bobLocalMiner;
            let hasMover = hasLocalMiner && roleSum.bobMover >= minRoles.bobMover;
            let hasRemoteMinerW24N56 = hasMover && roleSum.bobRemoteMinerW24N56 >= minRoles.bobRemoteMinerW24N56;
            let hasInvaderW24N56 = hasRemoteMinerW24N56 && roleSum.bobInvaderW24N56 >= minRoles.bobInvaderW24N56;

            if (roleSum.bobNanny < minRoles.bobNanny) needsSpawn = true;
            if (!needsSpawn && hasNanny && roleSum.bobLocalMiner < minRoles.bobLocalMiner) needsSpawn = true;
            if (!needsSpawn && hasLocalMiner && roleSum.bobMover < minRoles.bobMover) needsSpawn = true;
            if (!needsSpawn && hasMover && roleSum.bobRemoteMinerW24N56 < minRoles.bobRemoteMinerW24N56) needsSpawn = true;
            if (!needsSpawn && hasRemoteMinerW24N56 && roleSum.bobInvaderW24N56 < minRoles.bobInvaderW24N56) needsSpawn = true;
            if (!needsSpawn && hasInvaderW24N56 && roleSum.bobRemoteHaulerW24N56 < minRoles.bobRemoteHaulerW24N56) needsSpawn = true;
            if (!needsSpawn && hasInvaderW24N56 && roleSum.bobHarvester < minRoles.bobHarvester) needsSpawn = true;
            if (!needsSpawn && hasInvaderW24N56 && roleSum.bobRepairer < minRoles.bobRepairer) needsSpawn = true;
            if (!needsSpawn && hasInvaderW24N56 && roleSum.bobHealer < (minRoles.bobHealer || 0) * 400) needsSpawn = true;
            if (!needsSpawn && hasInvaderW24N56 && mammyHasProblems && roleSum.bobHelper < (minRoles.bobHelper || 0) * timeLife) needsSpawn = true;
            if (!needsSpawn && hasInvaderW24N56 && roleSum.bobInvader < (minRoles.bobInvader || 0) * 1) needsSpawn = true;
            if (!needsSpawn && hasInvaderW24N56 && roleSum.bobRemoteMiner < (minRoles.bobRemoteMiner || 0) * 200) needsSpawn = true;
            if (!needsSpawn && hasInvaderW24N56 && roleSum.bobRemoteHauler < (minRoles.bobRemoteHauler || 0) * 600) needsSpawn = true;
            if (!needsSpawn && hasInvaderW24N56 && roleSum.bobReserver < (minRoles.bobReserver || 0) * 200) needsSpawn = true;

            if (needsSpawn) {
                spawn.memory.rejuvenationMode = false;
            } else {
                spawn.memory.rejuvenationMode = true;
            }
        } else {
            spawn.memory.rejuvenationMode = false;
        }
        /*==========================================================*/
    },

    spawnHarvester: function() {
        let spawn = Game.spawns['Bob'];
        if (!spawn) return ERR_INVALID_TARGET;
        let body = [];

        body.push(...Array(20).fill(WORK));
        body.push(...Array(5).fill(MOVE));
        body.push(...Array(10).fill(CARRY));

        let energyAvailable = spawn.room.energyAvailable;
        let homeRoom = spawn.room.name;

        let name = 'Harvester_' + spawn.name + '_' + homeRoom + '_' + Game.time;
        return spawn.spawnCreep(body, name, { memory: { role: 'bobHarvester' } });
    },

    spawnRepairer: function() {
        let spawn = Game.spawns['BobDelta'];
        if (!spawn) return ERR_INVALID_TARGET;

        let body = [];

        body.push(...Array(20).fill(WORK));
        body.push(...Array(17).fill(MOVE));
        body.push(...Array(13).fill(CARRY));

        let homeRoom = spawn.room.name;
        let name = 'Repairer_' + spawn.name + '_' + homeRoom + '_' + Game.time;
        return spawn.spawnCreep(body, name, { memory: { role: 'bobRepairer' } });
    },

    spawnMover: function() {
        let spawn = Game.spawns['Bob'];
        if (!spawn) return ERR_INVALID_TARGET;
        let body = [];

        body.push(...Array(15).fill(MOVE));
        body.push(...Array(30).fill(CARRY));

        let homeRoom = spawn.room.name;
        let name = 'Mover_' + spawn.name + '_' + homeRoom + '_' + Game.time;
        return spawn.spawnCreep(body, name, { memory: { role: 'bobMover', homeRoom: homeRoom } });
    },

    spawnHelper: function() {
        let spawn = Game.spawns['BobDelta'];
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
            WORK, WORK, WORK, WORK, WORK,
            MOVE, MOVE, MOVE, MOVE, MOVE
        ];

        let homeRoom = spawn.room.name;
        let name = 'Miner_' + spawn.name + '_' + homeRoom + '_' + Game.time;
        return spawn.spawnCreep(body, name, { memory: { role: 'bobLocalMiner' } });
    },

    spawnInvader: function() {
        let spawn = Game.spawns['BobDelta'];
        if (!spawn) return ERR_INVALID_TARGET;
        let body = [];

        body.push(...Array(5).fill(WORK));
        body.push(...Array(10).fill(MOVE));
        body.push(...Array(10).fill(CARRY));
        let remoteTargetRoom2 = 'W19N55';
        let name = 'Invader_' + spawn.name + '_' + remoteTargetRoom2 + '_' + Game.time;
        return spawn.spawnCreep(body, name, { memory: { role: 'bobInvader', homeRoom: spawn.room.name, remoteTargetRoom2 } });
    },

    spawnInvaderW24N56: function() {
        let spawn = Game.spawns['BobDelta'];
        if (!spawn) return ERR_INVALID_TARGET;
        let body = [
            WORK, WORK, WORK, WORK, WORK, WORK,
            MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
            CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
        ];
        let targetRoom = 'W24N56';
        let name = 'Invader_' + spawn.name + '_' + targetRoom + '_' + Game.time;
        return spawn.spawnCreep(body, name, { memory: { role: 'bobInvaderW24N56', homeRoom: spawn.room.name, targetRoom } });
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

    spawnRemoteMinerW24N56: function(targetRoom, fixedPositions) {
        let spawn = Game.spawns['BobDelta'];
        if (!spawn) return ERR_INVALID_TARGET;
        let body = [
            WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
            MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
        ];
        let name = 'RemoteMiner_' + spawn.name + '_' + targetRoom + '_' + Game.time;
        return spawn.spawnCreep(body, name, {
            memory: {
                role: 'bobRemoteMinerW24N56',
                targetRoom,
                fixedPositions
            }
        });
    },

    spawnRemoteHauler: function(targetRoom) {
        let spawn = Game.spawns['BobDelta'];
        if (!spawn) return ERR_INVALID_TARGET;
        let body = [];

        body.push(...Array(15).fill(MOVE));
        body.push(...Array(30).fill(CARRY));

        let name = 'RemoteHauler_' + spawn.name + '_' + targetRoom + '_' + Game.time;
        return spawn.spawnCreep(body, name, {
            memory: {
                role: 'bobRemoteHauler',
                targetRoom,
                homeRoom: spawn.room.name
            }
        });
    },

    spawnRemoteHaulerW24N56: function(targetRoom) {
        let spawn = Game.spawns['BobDelta'];
        if (!spawn) return ERR_INVALID_TARGET;
        let body = [];

        body.push(...Array(15).fill(MOVE));
        body.push(...Array(30).fill(CARRY));

        let name = 'RemoteHauler_' + spawn.name + '_' + targetRoom + '_' + Game.time;
        return spawn.spawnCreep(body, name, {
            memory: {
                role: 'bobRemoteHaulerW24N56',
                targetRoom,
                homeRoom: spawn.room.name
            }
        });
    },

    spawnReserver: function(targetRoom) {
        let spawn = Game.spawns['BobDelta'];
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


    spawnHealer: function() {
        let spawn = Game.spawns['BobDelta'];
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

        let body = [];

        body.push(...Array(11).fill(MOVE));
        body.push(...Array(20).fill(CARRY));

        let homeRoom = spawn.room.name;
        let name = 'Nanny_' + spawn.name + '_' + homeRoom + '_' + Game.time;
        return spawn.spawnCreep(body, name, {
            memory: {
                role: 'bobNanny',
                homeRoom: homeRoom
            }
        });
    },

    spawnMammyHealer: function() {
        let spawn = Game.spawns['BobDelta']; // объявляем переменную сразу
        if (!spawn) return ERR_INVALID_TARGET;

        let body = [];
        body.push(...Array(2).fill(TOUGH));
        body.push(...Array(16).fill(MOVE));
        body.push(...Array(14).fill(HEAL));

        let targetRoom = 'W24N56';
        let name = 'Healer_' + spawn.name + '_' + targetRoom + '_' + Game.time;
        return spawn.spawnCreep(body, name, {
            memory: {
                role: 'mammyHealer',
                targetRoom: 'W24N56',
                homeRoom: spawn.room.name
            }
        });
    },
    spawnMammyRanged: function() {
        spawn = Game.spawns['BobDelta']
        if (!spawn) return ERR_INVALID_TARGET;

        let body = [];
        body.push(...Array(5).fill(TOUGH));
        body.push(...Array(25).fill(MOVE));
        body.push(...Array(20).fill(RANGED_ATTACK));

        let targetRoom = 'W24N56';
        let name = 'Ranged_' + spawn.name + '_' + targetRoom + '_' + Game.time;
        return spawn.spawnCreep(body, name, {
            memory: {
                role: 'mammyRanged',
                targetRoom: targetRoom
            }
        });
    },
};

module.exports = spawnBobManager;

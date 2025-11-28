const { timeLife } = require('./variables');

let targetRoom = 'W22N55'
let targetRoomTwo = 'W21N56'
let spawnSteveManager = {
    tick: function() {
        let spawn = Game.spawns['Steve'];
        if (!spawn || spawn.spawning) return;

        const minRoles = {
            steveUpdater: 1,
            steveMiner: 800,
            steveMover: 1200,
            steveRepairer: 1,
            steveInvader: 100,
            steveInvaderTwo: 0,
            steveRemoteMiner: 100,
            steveRemoteMinerTwo: 0,
            steveRemoteHauler: 100,
            steveRemoteHaulerTwo: 0,
            steveReserver: 50,
            steveReserverTwo: 50,
        };

        const roleSum = {
            base:0,
            steveUpdater: 0,
            steveMiner: 0,
            steveMover: 0,
            steveRepairer: 0,
            steveInvader: 0,
            steveInvaderTwo: 0,
            steveRemoteMiner: 0,
            steveRemoteMinerTwo: 0,
            steveRemoteHauler: 0,
            steveRemoteHaulerTwo: 0,
            steveReserver: 0,
            steveReserverTwo: 0,
        };


        const allCreeps = Object.values(Game.creeps);
        for (let c of allCreeps) {
            if (roleSum.hasOwnProperty(c.memory.role) && c.ticksToLive) {
                roleSum[c.memory.role] += c.ticksToLive;
            }
        }



        if (roleSum.steveMover < minRoles.steveMover && !spawn.spawning) {
            if (this.spawnMover() === OK) return;
        }

        let hasEnoughMover = roleSum.steveMover >= minRoles.steveMover;

        if (hasEnoughMover) {
            if (roleSum.steveMiner < minRoles.steveMiner && !spawn.spawning) {
                if (this.spawnMiner() === OK) return;
            }

            let hasEnoughMiner = roleSum.steveMiner >= minRoles.steveMiner;

            if (hasEnoughMiner) {
                if (roleSum.steveUpdater < minRoles.steveUpdater && !spawn.spawning) {
                    if (this.spawnUpdater() === OK) return;
                }

                if (roleSum.steveRepairer < minRoles.steveRepairer && !spawn.spawning) {
                    if (this.spawnRepairer() === OK) return;
                }

                if (roleSum.steveInvader < minRoles.steveInvader && !spawn.spawning) {
                    if (this.spawnInvader() === OK) return;
                }

                if (roleSum.steveInvaderTwo < minRoles.steveInvaderTwo && !spawn.spawning) {
                    if (this.spawnInvaderTwo() === OK) return;
                }

                if (roleSum.steveRemoteMinerTwo < minRoles.steveRemoteMinerTwo && !spawn.spawning) {
                    if (this.spawnRemoteMinerTwo() === OK) return;
                }

                if (roleSum.steveRemoteMiner < minRoles.steveRemoteMiner && !spawn.spawning) {
                    if (this.spawnRemoteMiner() === OK) return;
                }
                if (roleSum.steveRemoteHauler < minRoles.steveRemoteHauler && !spawn.spawning) {
                    if (this.spawnRemoteHauler() === OK) return;
                }
                if (roleSum.steveRemoteHaulerTwo < minRoles.steveRemoteHaulerTwo && !spawn.spawning) {
                    if (this.spawnRemoteHaulerTwo() === OK) return;
                }
                if (roleSum.steveReserver < minRoles.steveReserver && !spawn.spawning) {
                    if (this.spawnReserver() === OK) return;
                }
                if (roleSum.steveReserverTwo < minRoles.steveReserverTwo && !spawn.spawning) {
                    if (this.spawnReserverTwo() === OK) return;
                }
            }
        }
    },

    spawnUpdater: function() {
        let spawn = Game.spawns['Steve'];
        if (!spawn) return ERR_INVALID_TARGET;

        let body = [];
        body.push(...Array(15).fill(WORK));
        body.push(...Array(5).fill(CARRY));
        body.push(...Array(1).fill(MOVE));

        let homeRoom = spawn.room.name;
        let name = 'Updater_' + spawn.name + '_' + homeRoom + '_' + Game.time;

        return spawn.spawnCreep(body, name, {
            memory: {
                role: 'steveUpdater',
                homeRoom: homeRoom
            }
        });
    },

    spawnMiner: function() {
        let spawn = Game.spawns['Steve'];
        if (!spawn) return ERR_INVALID_TARGET;


        let body = [];
        body.push(...Array(6).fill(WORK));
        body.push(...Array(3).fill(MOVE));

        let homeRoom = spawn.room.name;
        let name = 'Miner_' + spawn.name + '_' + homeRoom + '_' + Game.time;
        return spawn.spawnCreep(body, name, {
            memory: {
                role: 'steveMiner',
                homeRoom: homeRoom
            }
        });
    },

    spawnMover: function() {
        let spawn = Game.spawns['Steve'];
        if (!spawn) return ERR_INVALID_TARGET;
        let body = [];

        body.push(...Array(14).fill(CARRY));
        body.push(...Array(7).fill(MOVE));

        let homeRoom = spawn.room.name;
        let name = 'Mover_' + spawn.name + '_' + homeRoom + '_' + Game.time;
        return spawn.spawnCreep(body, name, {
            memory: {
                role: 'steveMover',
                homeRoom: homeRoom
            }
        });
    },

    spawnRemoteHauler: function() {
        let spawn = Game.spawns['Steve'];
        if (!spawn) return ERR_INVALID_TARGET;
        let body = [];

        body.push(...Array(15).fill(MOVE));
        body.push(...Array(30).fill(CARRY));

        let homeRoom = spawn.room.name;
        let name = 'Hauler_' + spawn.name + '_' + homeRoom + '_' + Game.time;
        return spawn.spawnCreep(body, name, {
            memory: {
                role: 'steveRemoteHauler',
                homeRoom: homeRoom
            }
        });
    },

    spawnRemoteHaulerTwo: function() {
        let spawn = Game.spawns['Steve'];
        if (!spawn) return ERR_INVALID_TARGET;
        let body = [];

        body.push(...Array(15).fill(MOVE));
        body.push(...Array(30).fill(CARRY));

        let homeRoom = spawn.room.name;
        let name = 'Hauler_' + '_' + targetRoomTwo + '_' + Game.time;
        return spawn.spawnCreep(body, name, {
            memory: {
                role: 'steveRemoteHaulerTwo',
                homeRoom: homeRoom,
                targetRoom: targetRoomTwo,
            }
        });
    },

    spawnRepairer: function() {
        let spawn = Game.spawns['Steve'];
        if (!spawn) return ERR_INVALID_TARGET;

        let body = [];
        body.push(...Array(5).fill(WORK));
        body.push(...Array(8).fill(CARRY));
        body.push(...Array(8).fill(MOVE));

        let homeRoom = spawn.room.name;
        let name = 'Repairer_' + spawn.name + '_' + homeRoom + '_' + Game.time;

        return spawn.spawnCreep(body, name, {
            memory: {
                role: 'steveRepairer',
                homeRoom: homeRoom
            }
        });
    },

    spawnInvader: function() {
        let spawn = Game.spawns['Steve'];
        if (!spawn) return ERR_INVALID_TARGET;

        let body = [];
        body.push(...Array(10).fill(WORK));
        body.push(...Array(8).fill(CARRY));
        body.push(...Array(9).fill(MOVE));

        let homeRoom = spawn.room.name;
        let name = 'Invader_' + spawn.name + '_' + homeRoom + '_' + Game.time;

        return spawn.spawnCreep(body, name, {
            memory: {
                role: 'steveInvader',
                homeRoom: homeRoom
            }
        });
    },

    spawnInvaderTwo: function() {
        let spawn = Game.spawns['Steve'];
        if (!spawn) return ERR_INVALID_TARGET;

        let body = [];
        body.push(...Array(10).fill(WORK));
        body.push(...Array(8).fill(CARRY));
        body.push(...Array(9).fill(MOVE));

        let homeRoom = spawn.room.name;
        let name = 'Invader_' + spawn.name + '_' + targetRoomTwo + '_' + Game.time;

        return spawn.spawnCreep(body, name, {
            memory: {
                role: 'steveInvaderTwo',
                homeRoom: homeRoom,
                targetRoom: targetRoomTwo,
            }
        });
    },

    spawnRemoteMiner: function() {
        let spawn = Game.spawns['Steve'];
        if (!spawn) return ERR_INVALID_TARGET;

        let miningPositions = [
            { x: 38, y: 35 },
        ];

        let body = [];
        body.push(...Array(6).fill(WORK));
        body.push(...Array(3).fill(MOVE));

        let homeRoom = spawn.room.name;
        let name = 'Miner_' + spawn.name + '_' + targetRoom + '_' + Game.time;
        return spawn.spawnCreep(body, name, {
            memory: {
                role: 'steveRemoteMiner',
                homeRoom: homeRoom,
                targetRoom: targetRoom,
                miningPositions: miningPositions,
            }
        });
    },

    spawnRemoteMinerTwo: function() {
        let spawn = Game.spawns['Steve'];
        if (!spawn) return ERR_INVALID_TARGET;
        let miningPositions = [
            { x: 45, y: 22 },
        ];


        let body = [];
        body.push(...Array(6).fill(WORK));
        body.push(...Array(3).fill(MOVE));

        let homeRoom = spawn.room.name;
        let name = 'Miner_' + spawn.name + '_' + targetRoomTwo + '_' + Game.time;
        return spawn.spawnCreep(body, name, {
            memory: {
                role: 'steveRemoteMinerTwo',
                homeRoom: homeRoom,
                targetRoom: targetRoomTwo,
                miningPositions: miningPositions,
            }
        });
    },


    spawnReserver: function() {
        let spawn = Game.spawns['Steve'];
        if (!spawn) return ERR_INVALID_TARGET;
        let body = [];

        body.push(...Array(2).fill(CLAIM));
        body.push(...Array(1).fill(MOVE));

        let name = 'Reserver_' + spawn.name + '_'  + '_' + Game.time;
        return spawn.spawnCreep(body, name, {
            memory: {
                role: 'steveReserver',
            }
        });
    },

    spawnReserverTwo: function() {
        let spawn = Game.spawns['Steve'];
        if (!spawn) return ERR_INVALID_TARGET;
        let body = [];

        body.push(...Array(2).fill(CLAIM));
        body.push(...Array(1).fill(MOVE));

        let name = 'Reserver_' + spawn.name + '_'  + '_' + Game.time;
        return spawn.spawnCreep(body, name, {
            memory: {
                role: 'steveReserverTwo',
                targetRoom: 'W19N55',
            }
        });
    },

};

module.exports = spawnSteveManager;


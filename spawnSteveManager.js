const { timeLife } = require('./variables');

let spawnSteveManager = {
    tick: function() {
        let spawn = Game.spawns['Steve'];
        if (!spawn || spawn.spawning) return;

        const minRoles = {
            steveUpdater: 100,
            steveMiner: 1200,
            steveMover: 100,
            steveRepairer: 100,
        };

        const roleSum = {
            steveUpdater: 0,
            steveMiner: 0,
            steveMover: 0,
            steveRepairer: 0
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
            }
        }
    },

    spawnUpdater: function() {
        let spawn = Game.spawns['Steve'];
        if (!spawn) return ERR_INVALID_TARGET;

        let body = [];
        body.push(...Array(10).fill(WORK));
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

};

module.exports = spawnSteveManager;


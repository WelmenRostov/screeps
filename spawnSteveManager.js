const { timeLife } = require('./variables');

let spawnSteveManager = {
    tick: function() {
        let spawn = Game.spawns['Steve'];
        if (!spawn || spawn.spawning) return;

        const minRoles = {
            steveUpdater: 2,
            steveMiner: 2,
            steveMover: 2
        };

        const roleSum = {
            steveUpdater: 0,
            steveMiner: 0,
            steveMover: 0
        };

        const allCreeps = Object.values(Game.creeps);
        for (let c of allCreeps) {
            if (roleSum.hasOwnProperty(c.memory.role) && c.ticksToLive) {
                roleSum[c.memory.role] += c.ticksToLive;
            }
        }

        if (roleSum.steveMiner < minRoles.steveMiner * 600 && !spawn.spawning) {
            this.spawnMiner();
        }

        if (roleSum.steveMover < minRoles.steveMover * 800 && !spawn.spawning) {
            this.spawnMover();
        }

        if (roleSum.steveUpdater < minRoles.steveUpdater * timeLife && !spawn.spawning) {
            this.spawnUpdater();
        }
    },

    spawnUpdater: function() {
        let spawn = Game.spawns['Steve'];
        if (!spawn) return ERR_INVALID_TARGET;
        
        let body = [WORK, WORK, WORK, WORK, MOVE, CARRY, CARRY, CARRY, CARRY];
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
        let body = [
            WORK, WORK, WORK, WORK, WORK, MOVE,  MOVE, MOVE
        ];
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
        let body = [
            MOVE, MOVE, MOVE, MOVE, MOVE,  CARRY, CARRY, CARRY,
            CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
        ];
        let homeRoom = spawn.room.name;
        let name = 'Mover_' + spawn.name + '_' + homeRoom + '_' + Game.time;
        return spawn.spawnCreep(body, name, {
            memory: {
                role: 'steveMover',
                homeRoom: homeRoom
            }
        });
    }
};

module.exports = spawnSteveManager;


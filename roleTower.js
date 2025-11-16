let roleTower = {
    /** @param {StructureTower} tower **/
    run: function(tower) {
        new RoomVisual(tower.room.name).text('🏰', tower.pos.x, tower.pos.y - 0.55, { align: 'center', font: 0.5, opacity: 1 });

        let enemy = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (enemy) {
            tower.attack(enemy);
            return;
        }

        let hostileStructure = tower.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES);
        if (hostileStructure) {
            tower.attack(hostileStructure);
            return;
        }

        if (tower.pos.x === 22 && tower.pos.y === 44 && tower.room.name !== 'W23N56') {
            return;
        }

        if (tower.room.find(FIND_HOSTILE_CREEPS).length === 0) {
            let damagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (s) => s.hits < s.hitsMax * 0.8 && s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_RAMPART
            });

            if (damagedStructure) {
                tower.repair(damagedStructure);
                return;
            }

            let damagedCreep = tower.pos.findClosestByRange(FIND_MY_CREEPS, {
                filter: (c) => c.hits < c.hitsMax
            });

            if (damagedCreep) {
                tower.heal(damagedCreep);
            }
        }
    }
};

module.exports = roleTower;

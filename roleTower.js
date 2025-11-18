let roleTower = {
    /** @param {StructureTower} tower **/
    run: function(tower) {
        new RoomVisual(tower.room.name).text('🏰', tower.pos.x, tower.pos.y - 0.55, { align: 'center', font: 0.5, opacity: 1 });

        let hostileCreeps = tower.room.find(FIND_HOSTILE_CREEPS);
        if (hostileCreeps.length > 0) {
            if (!Memory.towerTargets) Memory.towerTargets = {};
            if (!Memory.towerTargets[tower.room.name]) Memory.towerTargets[tower.room.name] = {};
            
            let roomTargets = Memory.towerTargets[tower.room.name];
            let allTowers = tower.room.find(FIND_MY_STRUCTURES, {
                filter: s => s.structureType === STRUCTURE_TOWER
            });
            
            let targetCounts = {};
            for (let t of allTowers) {
                if (t.id !== tower.id && roomTargets[t.id]) {
                    let targetId = roomTargets[t.id];
                    targetCounts[targetId] = (targetCounts[targetId] || 0) + 1;
                }
            }
            
            let healers = hostileCreeps.filter(c => c.getActiveBodyparts(HEAL) > 0);
            let candidates = null;
            
            if (healers.length > 0) {
                candidates = healers;
            } else {
                candidates = hostileCreeps;
            }
            
            let bestTarget = null;
            let minCount = Infinity;
            let minRange = Infinity;
            
            for (let creep of candidates) {
                let count = targetCounts[creep.id] || 0;
                let range = tower.pos.getRangeTo(creep);
                
                if (count < minCount || (count === minCount && range < minRange)) {
                    minCount = count;
                    minRange = range;
                    bestTarget = creep;
                }
            }
            
            if (bestTarget) {
                roomTargets[tower.id] = bestTarget.id;
                tower.attack(bestTarget);
                return;
            }
        }
        
        if (Memory.towerTargets && Memory.towerTargets[tower.room.name]) {
            delete Memory.towerTargets[tower.room.name][tower.id];
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

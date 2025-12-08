let roleTower = {
    /** @param {StructureTower} tower **/
    run: function(tower) {
        new RoomVisual(tower.room.name).text('⚪️', tower.pos.x, tower.pos.y - 0.55, { align: 'center', font: 0.5, opacity: 1 });

        let hostileCreeps = tower.room.find(FIND_HOSTILE_CREEPS, {
            filter: c => c.owner.username !== 'an_w'
        });

        if (hostileCreeps.length > 0) {
            if (!Memory.towerTargets) Memory.towerTargets = {};
            if (!Memory.towerTargets[tower.room.name]) Memory.towerTargets[tower.room.name] = {};
            if (!Memory.towerLastAttack) Memory.towerLastAttack = {};
            if (!Memory.towerLastAttack[tower.room.name]) Memory.towerLastAttack[tower.room.name] = {};

            let roomTargets = Memory.towerTargets[tower.room.name];
            let roomLastAttack = Memory.towerLastAttack[tower.room.name];
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

            let lastTargetId = roomTargets[tower.id];
            let bestTarget = null;
            let minCount = Infinity;
            let targetsWithMinCount = [];

            for (let creep of hostileCreeps) {
                let count = targetCounts[creep.id] || 0;

                if (count < minCount) {
                    minCount = count;
                    targetsWithMinCount = [creep];
                } else if (count === minCount) {
                    targetsWithMinCount.push(creep);
                }
            }

            if (targetsWithMinCount.length > 0) {
                if (targetsWithMinCount.length === 1) {
                    bestTarget = targetsWithMinCount[0];
                } else {
                    let targetsNotLast = targetsWithMinCount.filter(t => t.id !== lastTargetId);
                    if (targetsNotLast.length > 0) {
                        targetsWithMinCount = targetsNotLast;
                    }

                    targetsWithMinCount.sort((a, b) => {
                        let aLastAttack = roomLastAttack[a.id] || 0;
                        let bLastAttack = roomLastAttack[b.id] || 0;
                        if (aLastAttack !== bLastAttack) {
                            return aLastAttack - bLastAttack;
                        }
                        return tower.pos.getRangeTo(a) - tower.pos.getRangeTo(b);
                    });

                    bestTarget = targetsWithMinCount[0];
                }
            }

            if (bestTarget) {
                roomTargets[tower.id] = bestTarget.id;
                roomLastAttack[bestTarget.id] = Game.time;
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

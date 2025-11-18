const creepMovement = require('./creepMovement');

let roleBobHealer = {
    run: function(creep) {
        new RoomVisual(creep.room.name).text('💚', creep.pos.x, creep.pos.y - 0.55, { align: 'center', font: 0.1, opacity: 1 });

        const targetRoom = creep.memory.targetRoom || 'W24N56';

        if (creep.room.name !== targetRoom) {
            creepMovement.moveTo(creep, new RoomPosition(25, 25, targetRoom), {
                reusePath: 20,
                visualizePathStyle: { stroke: '#00ff00' }
            });
            return;
        }

        let defender = creep.room.find(FIND_MY_CREEPS, {
            filter: c => c.memory.role === 'mammyDefender'
        })[0];

        if (defender && defender.pos) {
            let defenderTarget = null;
            let hostileCreeps = defender.room.find(FIND_HOSTILE_CREEPS);
            if (hostileCreeps.length > 0) {
                defenderTarget = defender.pos.findClosestByPath(hostileCreeps);
            } else {
                let sourceKeepers = defender.room.find(FIND_STRUCTURES, {
                    filter: structure => structure.structureType === STRUCTURE_KEEPER_LAIR
                });
                if (sourceKeepers.length > 0) {
                    sourceKeepers.sort((a, b) => a.ticksToSpawn - b.ticksToSpawn);
                    defenderTarget = sourceKeepers[0];
                }
            }
            
            if (defenderTarget) {
                let defenderPath = defender.pos.findPathTo(defenderTarget, {
                    ignoreCreeps: true
                });
                
                let isOnPath = defenderPath.some(step => 
                    step.x === creep.pos.x && step.y === creep.pos.y
                );
                
                if (isOnPath) {
                    let fleePositions = [];
                    for (let dx = -1; dx <= 1; dx++) {
                        for (let dy = -1; dy <= 1; dy++) {
                            if (dx === 0 && dy === 0) continue;
                            let testX = creep.pos.x + dx;
                            let testY = creep.pos.y + dy;
                            if (testX < 0 || testX > 49 || testY < 0 || testY > 49) continue;
                            
                            let testPos = new RoomPosition(testX, testY, creep.room.name);
                            let terrain = testPos.lookFor(LOOK_TERRAIN)[0];
                            if (terrain === 'wall') continue;
                            
                            let structs = testPos.lookFor(LOOK_STRUCTURES);
                            if (structs.some(s => s.structureType !== STRUCTURE_ROAD && s.structureType !== STRUCTURE_CONTAINER)) continue;
                            
                            let creepsOnPos = testPos.lookFor(LOOK_CREEPS);
                            if (creepsOnPos.length > 0) continue;
                            
                            let onPath = defenderPath.some(step => step.x === testX && step.y === testY);
                            if (!onPath) {
                                fleePositions.push(testPos);
                            }
                        }
                    }
                    
                    if (fleePositions.length > 0) {
                        let bestFlee = fleePositions[0];
                        let maxRange = creep.pos.getRangeTo(bestFlee);
                        for (let pos of fleePositions) {
                            let range = creep.pos.getRangeTo(pos);
                            if (range > maxRange) {
                                maxRange = range;
                                bestFlee = pos;
                            }
                        }
                        creepMovement.moveTo(creep, bestFlee, {
                            reusePath: 3,
                            visualizePathStyle: { stroke: '#ffff00' }
                        });
                        return;
                    }
                }
            }
        }

        let hostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS);
        let hasEnemies = hostileCreeps.length > 0;

        if (defender && defender.pos && defender.room && defender.room.name) {
            let rangeToDefender = creep.pos.getRangeTo(defender);

            let healTarget = null;
            if (defender.hits < defender.hitsMax) {
                healTarget = defender;
            } else if (creep.hits < creep.hitsMax) {
                healTarget = creep;
            } else if (!hasEnemies) {
                let damagedCreeps = creep.room.find(FIND_MY_CREEPS, {
                    filter: c => c.hits < c.hitsMax && c.id !== creep.id && c.id !== defender.id
                });
                if (damagedCreeps.length > 0) {
                    healTarget = creep.pos.findClosestByPath(damagedCreeps);
                }
            }

            let moveTarget = null;

            if (healTarget) {
                let rangeToHeal = creep.pos.getRangeTo(healTarget);

                if (rangeToHeal <= 1) {
                    if (healTarget === creep) {
                        creep.heal(creep);
                    } else {
                        creep.heal(healTarget);
                    }
                } else if (rangeToHeal <= 3) {
                    if (healTarget === creep) {
                        creep.rangedHeal(creep);
                    } else {
                        creep.rangedHeal(healTarget);
                    }
                }

                if (rangeToHeal > 1) {
                    moveTarget = healTarget;
                }
            }

            if (!moveTarget) {
                if (hasEnemies) {
                    let closestHostile = creep.pos.findClosestByPath(hostileCreeps);
                    if (closestHostile && defender.pos) {
                        let bestPos = null;
                        let bestScore = -Infinity;

                        for (let dx = -3; dx <= 3; dx++) {
                            for (let dy = -3; dy <= 3; dy++) {
                                let testX = defender.pos.x + dx;
                                let testY = defender.pos.y + dy;

                                if (testX < 0 || testX > 49 || testY < 0 || testY > 49) continue;

                                let testPos = new RoomPosition(testX, testY, defender.room.name);
                                let terrain = testPos.lookFor(LOOK_TERRAIN)[0];
                                if (terrain === 'wall') continue;

                                let rangeToDef = testPos.getRangeTo(defender);
                                let rangeToHost = testPos.getRangeTo(closestHostile);

                                if (rangeToDef <= 3 && rangeToHost > 1) {
                                    let score = rangeToHost * 10 - rangeToDef;
                                    if (score > bestScore) {
                                        bestScore = score;
                                        bestPos = testPos;
                                    }
                                }
                            }
                        }

                        if (bestPos) {
                            moveTarget = bestPos;
                        } else {
                            moveTarget = defender.pos;
                        }
                    } else {
                        if (rangeToDefender < 2 || rangeToDefender > 3) {
                            moveTarget = defender.pos;
                        }
                    }
                } else {
                    if (rangeToDefender < 2 || rangeToDefender > 3) {
                        moveTarget = defender.pos;
                    }
                }
            }

            if (moveTarget && !creep.pos.isEqualTo(moveTarget)) {
                let range = 0;
                if (moveTarget === defender.pos) {
                    range = 2;
                } else if (healTarget && moveTarget === healTarget) {
                    range = 1;
                }
                creepMovement.moveTo(creep, moveTarget, {
                    reusePath: 5,
                    range: range,
                    visualizePathStyle: { stroke: '#00ffff' }
                });
            }

            if (healTarget) {
                let rangeToHeal = creep.pos.getRangeTo(healTarget);
                if (rangeToHeal <= 1) {
                    if (healTarget === creep) {
                        creep.heal(creep);
                    } else {
                        creep.heal(healTarget);
                    }
                } else if (rangeToHeal <= 3) {
                    if (healTarget === creep) {
                        creep.rangedHeal(creep);
                    } else {
                        creep.rangedHeal(healTarget);
                    }
                }
            }
        } else {
            if (creep.hits < creep.hitsMax) {
                creep.heal(creep);
            } else if (!hasEnemies) {
                let damagedCreeps = creep.room.find(FIND_MY_CREEPS, {
                    filter: c => c.hits < c.hitsMax && c.id !== creep.id
                });

                if (damagedCreeps.length > 0) {
                    let target = creep.pos.findClosestByPath(damagedCreeps);
                    if (target) {
                        let range = creep.pos.getRangeTo(target);
                        if (range <= 1) {
                            creep.heal(target);
                        } else if (range <= 3) {
                            creep.rangedHeal(target);
                        }

                        if (range > 1) {
                            creepMovement.moveTo(creep, target, {
                                reusePath: 5,
                                range: 1,
                                visualizePathStyle: { stroke: '#00ff00' }
                            });
                        }
                    }
                } else {
                    creepMovement.moveTo(creep, new RoomPosition(25, 25, targetRoom), {
                        reusePath: 20,
                        visualizePathStyle: { stroke: '#ffffff' }
                    });
                }
            } else {
                creepMovement.moveTo(creep, new RoomPosition(25, 25, targetRoom), {
                    reusePath: 20,
                    visualizePathStyle: { stroke: '#ffffff' }
                });
            }
        }
    }
};

module.exports = roleBobHealer;


const creepMovement = require('./creepMovement');

let roleBobLocalMiner = {
    run: function(creep) {
        new RoomVisual(creep.room.name).text('⛏️', creep.pos.x, creep.pos.y - 0.55, { align: 'center', font: 0.5, opacity: 1 });

        let sources = creep.room.find(FIND_SOURCES);
        if (sources.length === 0) return;

        let fixedPositions = [];
        for (let source of sources) {
            let container = source.pos.findInRange(FIND_STRUCTURES, 1, {
                filter: s => s.structureType === STRUCTURE_CONTAINER
            })[0];
            if (container) {
                fixedPositions.push({
                    pos: container.pos,
                    source: source
                });
            } else {
                let adjacentPos = source.pos.findClosestByRange(FIND_FLAGS);
                if (!adjacentPos) {
                    let positions = [];
                    for (let dx = -1; dx <= 1; dx++) {
                        for (let dy = -1; dy <= 1; dy++) {
                            if (dx === 0 && dy === 0) continue;
                            let x = source.pos.x + dx;
                            let y = source.pos.y + dy;
                            if (x >= 0 && x <= 49 && y >= 0 && y <= 49) {
                                let terrain = new RoomPosition(x, y, creep.room.name).lookFor(LOOK_TERRAIN)[0];
                                if (terrain !== 'wall') {
                                    positions.push(new RoomPosition(x, y, creep.room.name));
                                }
                            }
                        }
                    }
                    if (positions.length > 0) {
                        fixedPositions.push({
                            pos: positions[0],
                            source: source
                        });
                    }
                }
            }
        }

        if (fixedPositions.length === 0) {
            let closestSource = creep.pos.findClosestByRange(sources);
            if (closestSource) {
                if (creep.harvest(closestSource) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, closestSource, { reusePath: 5, visualizePathStyle: { stroke: '#ffaa00' } });
                }
                if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
                    creep.drop(RESOURCE_ENERGY);
                }
            }
            return;
        }

        if (creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
            const under = creep.pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_CONTAINER);
            if (!under) {
                creep.drop(RESOURCE_ENERGY);
            }
        }

        let allMiners = Object.values(Game.creeps).filter(c => 
            c.memory.role === 'bobLocalMiner' && 
            c.room.name === creep.room.name
        );

        let sourceMinersCount = {};
        for (let source of sources) {
            sourceMinersCount[source.id] = 0;
        }

        for (let miner of allMiners) {
            if (miner === creep) continue;
            for (let source of sources) {
                if (miner.pos.getRangeTo(source) <= 2) {
                    sourceMinersCount[source.id]++;
                    break;
                }
            }
        }

        let positionsInfo = [];
        for (let fixed of fixedPositions) {
            let isMyPos = creep.pos.x === fixed.pos.x && creep.pos.y === fixed.pos.y;
            let posOccupied = allMiners.some(c => 
                c !== creep && 
                c.pos.x === fixed.pos.x && 
                c.pos.y === fixed.pos.y
            );
            let minerCount = sourceMinersCount[fixed.source.id] || 0;

            positionsInfo.push({
                pos: fixed.pos,
                source: fixed.source,
                posOccupied: posOccupied,
                minerCount: minerCount,
                isMyPos: isMyPos
            });
        }

        let targetPos = null;
        let targetSource = null;

        let myPosInfo = positionsInfo.find(p => p.isMyPos);
        if (myPosInfo) {
            let canWork = !myPosInfo.posOccupied && 
                         (myPosInfo.minerCount === 0 || 
                          (myPosInfo.minerCount === 1 && creep.pos.getRangeTo(myPosInfo.source) <= 1));
            
            if (canWork) {
                targetPos = myPosInfo.pos;
                targetSource = myPosInfo.source;
            }
        }

        if (!targetPos) {
            let availablePositions = positionsInfo.filter(p => !p.posOccupied);

            if (availablePositions.length > 0) {
                availablePositions.sort((a, b) => {
                    if (a.minerCount !== b.minerCount) {
                        return a.minerCount - b.minerCount;
                    }
                    return creep.pos.getRangeTo(a.pos) - creep.pos.getRangeTo(b.pos);
                });
                targetPos = availablePositions[0].pos;
                targetSource = availablePositions[0].source;
            }
        }

        if (targetPos && targetSource) {
            if (creep.pos.x === targetPos.x && creep.pos.y === targetPos.y) {
                let rangeToSource = creep.pos.getRangeTo(targetSource);
                
                if (rangeToSource > 1) {
                    creepMovement.moveTo(creep, targetSource, { 
                        reusePath: 5, 
                        visualizePathStyle: { stroke: '#ffaa00' } 
                    });
                    return;
                }
                
                let posOccupiedNow = allMiners.some(c => 
                    c !== creep && 
                    c.pos.x === targetPos.x && 
                    c.pos.y === targetPos.y
                );
                
                if (posOccupiedNow) {
                    let freePos = positionsInfo.find(p => 
                        !p.posOccupied && 
                        p.minerCount === 0 && 
                        !p.isMyPos
                    );
                    if (freePos) {
                        targetPos = freePos.pos;
                        targetSource = freePos.source;
                        creepMovement.moveTo(creep, targetPos, { 
                            reusePath: 10, 
                            visualizePathStyle: { stroke: '#ffaa00' } 
                        });
                        return;
                    }
                }
                
                const res = creep.harvest(targetSource);
                if (res === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, targetSource, { 
                        reusePath: 2, 
                        visualizePathStyle: { stroke: '#ffaa00' } 
                    });
                    return;
                }
                
                if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
                    const container = targetPos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_CONTAINER);
                    if (container) {
                        if (creep.transfer(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                            creepMovement.moveTo(creep, container, { 
                                reusePath: 2, 
                                visualizePathStyle: { stroke: '#00ff00' } 
                            });
                        }
                    } else {
                        creep.drop(RESOURCE_ENERGY);
                    }
                }
                return;
            } else {
                creepMovement.moveTo(creep, targetPos, { 
                    reusePath: 10, 
                    visualizePathStyle: { stroke: '#ffaa00' } 
                });
            }
        }
    }
};

module.exports = roleBobLocalMiner;


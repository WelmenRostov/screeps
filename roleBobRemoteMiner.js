const creepMovement = require('./creepMovement');

let roleBobRemoteMiner = {
    run: function(creep) {
        new RoomVisual(creep.room.name).text('⛏️', creep.pos.x, creep.pos.y - 0.55, { align: 'center', font: 0.5, opacity: 1 });

        const targetRoom = creep.memory.targetRoom || 'W23N56';

        const fixedPositionsData = creep.memory.fixedPositions && Array.isArray(creep.memory.fixedPositions)
            ? creep.memory.fixedPositions
            : [
                { x: 19, y: 41, roomName: targetRoom },
                { x: 40, y: 41, roomName: targetRoom }
            ];

        const fixedPositions = fixedPositionsData.map(pos =>
            new RoomPosition(pos.x, pos.y, pos.roomName || targetRoom)
        );

        if (creep.room.name !== targetRoom) {
            if (creep.pos.x === 0) {
                creep.move(RIGHT);
                return;
            }
            if (creep.pos.x === 49) {
                creep.move(LEFT);
                return;
            }
            if (creep.pos.y === 0) {
                creep.move(BOTTOM);
                return;
            }
            if (creep.pos.y === 49) {
                creep.move(TOP);
                return;
            }

            creepMovement.moveTo(creep, new RoomPosition(25, 25, targetRoom), {
                reusePath: 15,
                visualizePathStyle: { stroke: '#ffaa00' }
            });
            return;
        }

        if (creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
            const under = creep.pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_CONTAINER);
            if (!under) {
                creep.drop(RESOURCE_ENERGY);
            }
        }

        let targetPos = null;
        let targetSource = null;
        let positionsInfo = [];
        let myCurrentPos = null;

        for (let pos of fixedPositions) {
            let nearbySource = pos.findInRange(FIND_SOURCES, 1)[0];
            if (!nearbySource) continue;

            let creepsOnPos = pos.lookFor(LOOK_CREEPS);
            let otherMiner = creepsOnPos.find(c => c !== creep && c.memory.role === 'bobRemoteMiner');
            let isMyPos = creep.pos.x === pos.x && creep.pos.y === pos.y;

            if (isMyPos) {
                myCurrentPos = pos;
            }

            positionsInfo.push({
                pos,
                source: nearbySource,
                occupied: Boolean(otherMiner),
                ticksToLive: otherMiner ? otherMiner.ticksToLive : Infinity,
                isMyPos
            });
        }

        if (myCurrentPos) {
            let myPosInfo = positionsInfo.find(p => p.isMyPos);
            let creepsOnMyPos = myCurrentPos.lookFor(LOOK_CREEPS);
            let otherMinerOnMyPos = creepsOnMyPos.find(c => c !== creep && c.memory.role === 'bobRemoteMiner');
            if (!otherMinerOnMyPos && myPosInfo) {
                targetPos = myCurrentPos;
                targetSource = myPosInfo.source;
            }
        }

        if (!targetPos) {
            let freePositions = positionsInfo.filter(p => !p.occupied);
            if (freePositions.length > 0) {
                freePositions.sort((a, b) => creep.pos.getRangeTo(a.pos) - creep.pos.getRangeTo(b.pos));
                targetPos = freePositions[0].pos;
                targetSource = freePositions[0].source;
            } else {
                let occupiedPositions = positionsInfo.filter(p => p.occupied);
                if (occupiedPositions.length > 0) {
                    occupiedPositions.sort((a, b) => a.ticksToLive - b.ticksToLive);
                    targetPos = occupiedPositions[0].pos;
                    targetSource = occupiedPositions[0].source;
                }
            }
        }

        if (targetPos && creep.pos.isEqualTo(targetPos)) {
            let creepsOnPos = targetPos.lookFor(LOOK_CREEPS);
            let otherMiner = creepsOnPos.find(c => c !== creep && c.memory.role === 'bobRemoteMiner');

            if (otherMiner) {
                let freePos = positionsInfo.find(p => !p.occupied && !p.isMyPos);
                if (freePos) {
                    targetPos = freePos.pos;
                    targetSource = freePos.source;
                } else {
                    return;
                }
            } else if (targetSource) {
                if (targetSource.energy > 0) {
                    let res = creep.harvest(targetSource);
                    if (res === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, targetSource, {
                            reusePath: 5,
                            visualizePathStyle: { stroke: '#ffaa00' }
                        });
                    }
                }

                if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
                    const container = targetPos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_CONTAINER);
                    if (container) {
                        creep.transfer(container, RESOURCE_ENERGY);
                    } else {
                        creep.drop(RESOURCE_ENERGY);
                    }
                }
            }
            return;
        }

        if (targetPos && targetSource) {
            creepMovement.moveTo(creep, targetPos, {
                reusePath: 10,
                visualizePathStyle: { stroke: '#ffaa00' }
            });
        }
    }
};

module.exports = roleBobRemoteMiner;


const creepMovement = require('./creepMovement');

let roleRemoteMiner = {
    /** @param {Creep} creep **/
    run: function(creep) {
        new RoomVisual(creep.room.name).text('⛏️', creep.pos.x, creep.pos.y - 0.55, { align: 'center', font: 0.5, opacity: 1 });

        const targetRoom = creep.memory.targetRoom;
        if (!targetRoom) return;

        // Если не в целевой комнате — идём туда
        if (creep.room.name !== targetRoom) {
            creepMovement.moveTo(creep, new RoomPosition(25, 25, targetRoom), {
                reusePath: 15,
                visualizePathStyle: { stroke: '#ffaa00' }
            });
            return;
        }

        // Получаем позиции из памяти
        const fixedPositions = creep.memory.miningPositions || [
            new RoomPosition(41, 9, targetRoom),
            new RoomPosition(28, 43, targetRoom)
        ];

        // В целевой: сбрасываем энергию под себя
        if (creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
            const under = creep.pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_CONTAINER);
            if (!under) {
                creep.drop(RESOURCE_ENERGY);
            }
        }

        // Проверяем все позиции
        let targetPos = null;
        let targetSource = null;
        let positionsInfo = [];
        let myCurrentPos = null;

        // Ищем ближайшую свободную позицию или проверяем, если на текущей позиции есть источник
        for (let pos of fixedPositions) {
            // Находим источник рядом с позицией (в радиусе 1)
            let nearbySource = pos.findInRange(FIND_SOURCES, 1)[0];
            if (!nearbySource) continue;

            // Проверяем, кто находится на позиции
            let creepsOnPos = pos.lookFor(LOOK_CREEPS);
            let otherMiner = creepsOnPos.find(c => c !== creep && c.memory.role === 'remoteMiner');
            let isMyPos = creep.pos.x === pos.x && creep.pos.y === pos.y;

            if (isMyPos) {
                myCurrentPos = pos;
            }

            if (!otherMiner) {
                // Позиция свободна
                positionsInfo.push({
                    pos: pos,
                    source: nearbySource,
                    occupied: false,
                    ticksToLive: Infinity,
                    isMyPos: isMyPos
                });
            } else {
                // Позиция занята другим крипом
                positionsInfo.push({
                    pos: pos,
                    source: nearbySource,
                    occupied: true,
                    ticksToLive: otherMiner.ticksToLive,
                    isMyPos: isMyPos
                });
            }
        }

        // Если мы уже на своей позиции, продолжаем работать
        if (myCurrentPos) {
            let myPosInfo = positionsInfo.find(p => p.isMyPos);
            let creepsOnMyPos = myCurrentPos.lookFor(LOOK_CREEPS);
            let otherMinerOnMyPos = creepsOnMyPos.find(c => c !== creep && c.memory.role === 'remoteMiner');

            if (!otherMinerOnMyPos && myPosInfo) {
                targetPos = myCurrentPos;
                targetSource = myPosInfo.source;
            }
        }

        // Если ещё не выбрали позицию, выбираем свободную (независимо от энергии)
        if (!targetPos) {
            let freePositions = positionsInfo.filter(p => !p.occupied);
            if (freePositions.length > 0) {
                // Есть свободные позиции - выбираем ближайшую (даже если источник пуст)
                freePositions.sort((a, b) => creep.pos.getRangeTo(a.pos) - creep.pos.getRangeTo(b.pos));
                targetPos = freePositions[0].pos;
                targetSource = freePositions[0].source;
            } else {
                // Все позиции заняты - выбираем ту, где у крипа меньше ticksToLive (для замены)
                let occupiedPositions = positionsInfo.filter(p => p.occupied);
                if (occupiedPositions.length > 0) {
                    occupiedPositions.sort((a, b) => a.ticksToLive - b.ticksToLive);
                    targetPos = occupiedPositions[0].pos;
                    targetSource = occupiedPositions[0].source;
                }
            }
        }

        // Если мы на целевой позиции
        if (targetPos && creep.pos.x === targetPos.x && creep.pos.y === targetPos.y) {
            let creepsOnPos = targetPos.lookFor(LOOK_CREEPS);
            let otherMiner = creepsOnPos.find(c => c !== creep && c.memory.role === 'remoteMiner');

            if (otherMiner) {
                // На позиции есть другой крип, ищем свободную
                let freePos = positionsInfo.find(p => !p.occupied && !p.isMyPos);
                if (freePos) {
                    targetPos = freePos.pos;
                    targetSource = freePos.source;
                } else {
                    return;  // Если нет свободных позиций, остаёмся на месте
                }
            } else if (targetSource) {
                if (targetSource.energy > 0) {
                    const res = creep.harvest(targetSource);
                    if (res === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, targetSource, {
                            reusePath: 5,
                            visualizePathStyle: { stroke: '#ffaa00' }
                        });
                    }
                }

                // Если источник пуст, оставляем крип на позиции и ждём
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

        // Двигаемся к целевой позиции
        if (targetPos && targetSource) {
            creepMovement.moveTo(creep, targetPos, {
                reusePath: 10,
                visualizePathStyle: { stroke: '#ffaa00' }
            });
        }
    }
};

module.exports = roleRemoteMiner;

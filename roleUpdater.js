const creepMovement = require('./creepMovement');
const { isNannyReserveContainer } = require('./variables');

let roleUpdater = {
    /** @param {Creep} creep **/
    run: function(creep) {
        // Иконка над апдатером
        new RoomVisual(creep.room.name).text('⚡', creep.pos.x, creep.pos.y - 0.55, { align: 'center', font: 0.5, opacity: 1 });

        if (creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.working = false;
        }

        if (creep.store.getFreeCapacity() === 0) {
            creep.memory.working = true;
        }

        if (creep.memory.working) {
            // === Улучшаем контроллер ===
            let controller = creep.room.controller;
            let rangeToController = creep.pos.getRangeTo(controller);
            
            if (rangeToController <= 3) {
                // Улучшаем контроллер
                creep.upgradeController(controller);
            } else {
                // Ищем свободное место рядом с контроллером
                let bestPosition = this.findBestUpgradePosition(creep, controller);
                
                if (bestPosition) {
                    creepMovement.moveTo(creep, bestPosition, { 
                        reusePath: 5,
                        visualizePathStyle: { stroke: '#ffffff' }
                    });
                } else {
                    // Если нет свободных мест - идём к контроллеру
                    creepMovement.moveTo(creep, controller, { 
                        range: 3,
                        reusePath: 10,
                        visualizePathStyle: { stroke: '#ffffff' }
                    });
                }
            }
        } else {
            // === Берём энергию из storage ===
            let storage = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_STORAGE && s.store[RESOURCE_ENERGY] > 0
            });

            if (storage) {
                if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, storage, { 
                        reusePath: 5,
                        visualizePathStyle: { stroke: '#ffaa00' } 
                    });
                }
            } else {
                // Если storage пуст — берём из контейнеров
                let container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                    filter: (s) => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0 && !isNannyReserveContainer(s.pos, creep.room.name)
                });

                if (container) {
                    if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, container, { 
                            reusePath: 5,
                            visualizePathStyle: { stroke: '#ffaa00' } 
                        });
                    }
                } else {
                    // Если нет энергии — идём к контроллеру и ждём
                    if (creep.pos.getRangeTo(creep.room.controller) > 3) {
                        creepMovement.moveTo(creep, creep.room.controller, { 
                            range: 3,
                            reusePath: 10,
                            visualizePathStyle: { stroke: '#ffffff' } 
                        });
                    }
                }
            }
        }
    },

    // Находит лучшую позицию для улучшения контроллера
    findBestUpgradePosition: function(creep, controller) {
        let positions = [];
        
        // Ищем все позиции в радиусе 3 от контроллера
        for (let x = controller.pos.x - 3; x <= controller.pos.x + 3; x++) {
            for (let y = controller.pos.y - 3; y <= controller.pos.y + 3; y++) {
                if (x >= 0 && x < 50 && y >= 0 && y < 50) {
                    let pos = new RoomPosition(x, y, creep.room.name);
                    let range = pos.getRangeTo(controller);
                    
                    if (range <= 3) {
                        // Проверяем, свободна ли позиция
                        let creepsAtPos = pos.lookFor(LOOK_CREEPS);
                        let structuresAtPos = pos.lookFor(LOOK_STRUCTURES);
                        
                        // Позиция свободна, если нет крипов и нет непроходимых структур
                        let isFree = creepsAtPos.length === 0 && 
                                    !structuresAtPos.some(s => s.structureType === STRUCTURE_WALL);
                        
                        if (isFree) {
                            positions.push({
                                pos: pos,
                                range: range,
                                distance: creep.pos.getRangeTo(pos)
                            });
                        }
                    }
                }
            }
        }
        
        // Сортируем по расстоянию до контроллера, затем по расстоянию до крипа
        positions.sort((a, b) => {
            if (a.range !== b.range) {
                return a.range - b.range; // Ближе к контроллеру лучше
            }
            return a.distance - b.distance; // Ближе к крипу лучше
        });
        
        return positions.length > 0 ? positions[0].pos : null;
    }
};

module.exports = roleUpdater;

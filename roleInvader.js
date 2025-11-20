const creepMovement = require('./creepMovement');
const { isNannyReserveContainer } = require('./variables');

let roleInvader = {
    /** @param {Creep} creep **/
    run: function(creep) {
        // Иконка над захватчиком
        new RoomVisual(creep.room.name).text('🏗️', creep.pos.x, creep.pos.y - 0.55, { align: 'center', font: 0.5, opacity: 1 });

        // Целевая комната
        const targetRoom = 'W22N56';
        const homeRoom = creep.memory.homeRoom || creep.room.name;

        if (creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.working = false;
            delete creep.memory.repairTarget;
        }

        if (creep.store.getFreeCapacity() === 0) {
            creep.memory.working = true;
        }

        if (creep.memory.working) {
            // === Работаем в целевой комнате ===
            let currentRoom = creep.room.name;
            
            // Если не в целевой комнате - идём туда
            if (currentRoom !== targetRoom) {
                creepMovement.moveTo(creep, new RoomPosition(25, 25, targetRoom), { 
                    reusePath: 10,
                    visualizePathStyle: { stroke: '#ff0000' } 
                });
                return;
            }

            // Если есть запомненная цель ремонта дороги – продолжаем её (дороги всегда приоритетнее)
            if (creep.memory.repairTarget) {
                let targetStruct = Game.getObjectById(creep.memory.repairTarget);
                
                // Если цель исчезла, полностью отремонтирована или это не дорога — забываем её
                if (!targetStruct || targetStruct.hits >= targetStruct.hitsMax || targetStruct.structureType !== STRUCTURE_ROAD) {
                    delete creep.memory.repairTarget;
                } else {
                    let result = creep.repair(targetStruct);
                    if (result === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, targetStruct, { 
                            reusePath: 5,
                            visualizePathStyle: { stroke: '#ffff00' } 
                        });
                    } else if (result === OK) {
                        creep.room.visual.circle(targetStruct.pos, {fill: 'transparent', radius: 0.4, stroke: 'yellow', opacity: 0.7});
                    }
                    return;
                }
            }

            // 1) Ремонтируем повреждённые дороги если они меньше 50%
            let damagedRoad = creep.room.find(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_ROAD && s.hits < s.hitsMax * 0.5
            });

            if (damagedRoad.length > 0) {
                let closest = creep.pos.findClosestByPath(damagedRoad);
                if (closest) {
                    // Запоминаем цель для ремонта до 100%
                    creep.memory.repairTarget = closest.id;
                    if (creep.repair(closest) === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, closest, { 
                            reusePath: 5,
                            visualizePathStyle: { stroke: '#ffff00' } 
                        });
                    }
                    return;
                }
            }

            // 2) Ремонтируем остальные постройки (кроме дорог, стен, рампартов)
            let damagedStructure = creep.room.find(FIND_MY_STRUCTURES, {
                filter: (s) => s.hits < s.hitsMax && s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_RAMPART && s.structureType !== STRUCTURE_ROAD
            });
            
            if (damagedStructure.length > 0) {
                let closest = creep.pos.findClosestByPath(damagedStructure);
                if (closest) {
                    if (creep.repair(closest) === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, closest, { 
                            reusePath: 5,
                            visualizePathStyle: { stroke: '#ff0000' } 
                        });
                    }
                    return;
                }
            }

            // 3) Строим новые постройки
            let constructionSite = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
            
            if (constructionSite) {
                if (creep.build(constructionSite) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, constructionSite, { 
                        reusePath: 5,
                        visualizePathStyle: { stroke: '#00ff00' } 
                    });
                }
                return;
            }

            // 4) Ремонтируем стены/рампарты
            let weakWall = creep.room.find(FIND_MY_STRUCTURES, {
                filter: (s) => (s.structureType === STRUCTURE_WALL || s.structureType === STRUCTURE_RAMPART) && s.hits < s.hitsMax
            });

            if (weakWall.length > 0) {
                let closest = creep.pos.findClosestByPath(weakWall);
                if (closest) {
                    if (creep.repair(closest) === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, closest, { 
                            reusePath: 5,
                            visualizePathStyle: { stroke: '#ff8800' } 
                        });
                    }
                    return;
                }
            }

            let fallbackRepair = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => s.hits < s.hitsMax
            });

            if (fallbackRepair) {
                if (creep.repair(fallbackRepair) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, fallbackRepair, {
                        reusePath: 5,
                        visualizePathStyle: { stroke: '#00ffff' }
                    });
                }
                return;
            }

            // Нет работы - идём к центру комнаты и ждём
            creepMovement.moveTo(creep, new RoomPosition(25, 25, currentRoom), { 
                reusePath: 10,
                visualizePathStyle: { stroke: '#ffffff' } 
            });
        } else {
            // === Берём энергию ===
            
            const useTargetHarvest = creep.memory.useTargetHarvest !== false;

            // 1) В чужой комнате (targetRoom) — при желании добываем/собираем ресурс прямо на месте
            if (creep.room.name === targetRoom && useTargetHarvest) {
                let drop = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
                    filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount > 0
                });

                if (drop) {
                    if (creep.pickup(drop) === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, drop, { 
                            reusePath: 5,
                            visualizePathStyle: { stroke: '#ffaa00' } 
                        });
                    }
                    return;
                }

                let targetContainer = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                    filter: s => (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_STORAGE) &&
                        s.store[RESOURCE_ENERGY] > 0
                });

                if (targetContainer) {
                    if (creep.withdraw(targetContainer, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, targetContainer, { 
                            reusePath: 5,
                            visualizePathStyle: { stroke: '#ffaa00' } 
                        });
                    }
                    return;
                }

                let targetRuin = creep.pos.findClosestByPath(FIND_RUINS, {
                    filter: r => r.store && r.store[RESOURCE_ENERGY] > 0
                });

                if (targetRuin) {
                    if (creep.withdraw(targetRuin, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, targetRuin, { 
                            reusePath: 5,
                            visualizePathStyle: { stroke: '#ffaa00' } 
                        });
                    }
                    return;
                }

                let source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
                if (source) {
                    if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, source, { 
                            reusePath: 10,
                            visualizePathStyle: { stroke: '#ffaa00' } 
                        });
                    }
                    return;
                }
            }

            // 2) В домашней комнате - берём из storage
            if (creep.room.name === homeRoom) {
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
                    return;
                }

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
                    return;
                }
            }

            // 3) Не в домашней и нет энергии на земле в целевой - возвращаемся домой за энергией
            if (creep.room.name !== homeRoom) {
                const homeCenter = new RoomPosition(25, 25, homeRoom);
                creepMovement.moveTo(creep, homeCenter, { 
                    reusePath: 15, 
                    visualizePathStyle: { stroke: '#ffaa00' } 
                });
                return;
            }

            // 4) В домашней комнате, но нет storage/container - добываем из источника
            let source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
            if (source) {
                if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, source, { 
                        reusePath: 10, 
                        visualizePathStyle: { stroke: '#ffaa00' } 
                    });
                }
            }
        }
    }
};

module.exports = roleInvader;

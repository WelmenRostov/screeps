// Общий модуль для управления движением крипов с уступкой дороги
let creepMovement = {
    // Получает возраст крипа из имени (номер в конце имени)
    getCreepAge: function(creep) {
        let match = creep.name.match(/\d+$/);
        return match ? parseInt(match[0]) : Game.time;
    },

    // Старший ли этот крип относительно другого
    isOlderThan: function(creep, otherCreep) {
        return this.getCreepAge(creep) < this.getCreepAge(otherCreep);
    },

    // Получает все опасные зоны в комнате
    getDangerZones: function(roomName) {
        if (roomName !== 'W24N56') return [];
        
        let room = Game.rooms[roomName];
        if (!room) return [];
        
        let zones = [];
        
        // Зоны вокруг Source Keeper, если таймер < 60 тиков
        let lairs = room.find(FIND_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_KEEPER_LAIR
        });
        
        for (let lair of lairs) {
            if (lair.ticksToSpawn !== undefined && lair.ticksToSpawn <= 60) {
                zones.push({
                    center: lair.pos,
                    radius: 3,
                    type: 'keeper'
                });
            }
        }
        
        // Зоны вокруг вражеских крипов
        let hostiles = room.find(FIND_HOSTILE_CREEPS);
        for (let hostile of hostiles) {
            zones.push({
                center: hostile.pos,
                radius: 3,
                type: 'hostile',
                id: hostile.id
            });
        }
        
        return zones;
    },

    // Проверяет, находится ли позиция в опасной зоне
    isInDangerZone: function(pos, zones) {
        for (let zone of zones) {
            let range = pos.getRangeTo(zone.center);
            if (range <= zone.radius) {
                return true;
            }
        }
        return false;
    },

    // Проверяет, может ли крип находиться в зоне (дефендер и хиллер могут)
    canBeInZone: function(creep) {
        return creep.memory.role === 'mammyDefender' || 
               creep.memory.role === 'bobHealer' || 
               creep.memory.role === 'mammyHealer';
    },

    // Находит ближайшую безопасную позицию вне зон
    findSafePosition: function(creep, zones) {
        let currentPos = creep.pos;
        let bestPos = null;
        let bestRange = Infinity;
        
        for (let dx = -8; dx <= 8; dx++) {
            for (let dy = -8; dy <= 8; dy++) {
                let testX = currentPos.x + dx;
                let testY = currentPos.y + dy;
                
                if (testX < 0 || testX > 49 || testY < 0 || testY > 49) continue;
                
                let testPos = new RoomPosition(testX, testY, currentPos.roomName);
                let terrain = testPos.lookFor(LOOK_TERRAIN)[0];
                if (terrain === 'wall') continue;
                
                let inZone = false;
                for (let zone of zones) {
                    let range = testPos.getRangeTo(zone.center);
                    if (range <= zone.radius) {
                        inZone = true;
                        break;
                    }
                }
                
                if (!inZone) {
                    let range = Math.abs(dx) + Math.abs(dy);
                    if (range < bestRange) {
                        bestRange = range;
                        bestPos = testPos;
                    }
                }
            }
        }
        
        return bestPos;
    },

    // Визуализирует опасные зоны
    visualizeDangerZones: function(roomName, zones) {
        let room = Game.rooms[roomName];
        if (!room) return;
        
        for (let zone of zones) {
            for (let dx = -zone.radius; dx <= zone.radius; dx++) {
                for (let dy = -zone.radius; dy <= zone.radius; dy++) {
                    let x = zone.center.x + dx;
                    let y = zone.center.y + dy;
                    
                    if (x < 0 || x > 49 || y < 0 || y > 49) continue;
                    
                    let range = Math.max(Math.abs(dx), Math.abs(dy));
                    if (range <= zone.radius) {
                        room.visual.rect(x - 0.5, y - 0.5, 1, 1, {
                            fill: '#ff0000',
                            opacity: 0.3,
                            stroke: '#ff0000',
                            strokeWidth: 0.1
                        });
                    }
                }
            }
        }
    },

    // Получает настройку ignoreCreeps: младший уступает дорогу (false), старший проходит (true)
    getMoveOptions: function(creep, baseOptions = {}) {
        if (creep.memory.role === 'bobInvader') {
            return {
                ...baseOptions,
                ignoreCreeps: false
            };
        }
        // Бурильщик всегда имеет приоритет - все ему уступают
        if (creep.memory.role === 'driller') {
            return {
                ...baseOptions,
                ignoreCreeps: true
            };
        }
        
        // Защитник всегда имеет приоритет - все ему уступают
        if (creep.memory.role === 'mammyDefender') {
            return {
                ...baseOptions,
                ignoreCreeps: true
            };
        }

        // Проверяем, есть ли рядом другие крипы
        let otherCreeps = creep.room.find(FIND_CREEPS, {
            filter: (c) => c !== creep && c.memory && c.memory.role && c.pos.getRangeTo(creep) <= 2
        });
        
        let shouldYield = false;
        if (otherCreeps.length > 0) {
            // Хиллеры всегда уступают дорогу защитникам
            if ((creep.memory.role === 'bobHealer' || creep.memory.role === 'mammyHealer')) {
                let hasDefender = otherCreeps.some(c => c.memory && c.memory.role === 'mammyDefender');
                if (hasDefender) {
                    shouldYield = true;
                }
            }
            
            // Если рядом есть бурильщик - всегда уступаем ему дорогу
            let hasDriller = otherCreeps.some(c => c.memory && c.memory.role === 'driller');
            if (hasDriller) {
                shouldYield = true;
            } else if (creep.memory.role === 'filler') {
                // Заправщик уступает дорогу муверу
                let hasMover = otherCreeps.some(c => c.memory && c.memory.role === 'mover');
                if (hasMover) {
                    shouldYield = true;
                } else {
                    shouldYield = otherCreeps.some(c => this.isOlderThan(c, creep));
                }
            } else {
                // Если есть старшие крипы рядом - младший уступает дорогу
                shouldYield = otherCreeps.some(c => this.isOlderThan(c, creep));
            }
        }
        
        return {
            ...baseOptions,
            ignoreCreeps: !shouldYield // Младший уступает (ignoreCreeps: false), старший проходит (ignoreCreeps: true)
        };
    },

    // Обёртка для moveTo с автоматической уступкой дороги
    moveTo: function(creep, target, baseOptions = {}) {
        if (creep.room.name === 'W24N56' && !this.canBeInZone(creep)) {
            let zones = baseOptions.dangerZones || this.getDangerZones('W24N56');
            if (zones && zones.length > 0) {
                let targetPos = target && target.pos ? target.pos : (target instanceof RoomPosition ? target : null);
                if (targetPos && this.isInDangerZone(targetPos, zones)) {
                    let safePos = this.findSafePosition(creep, zones);
                    if (safePos) {
                        target = safePos;
                        baseOptions.reusePath = 0;
                    }
                }
                
                let originalCostCallback = baseOptions.costCallback;
                let options = this.getMoveOptions(creep, baseOptions);
                options.costCallback = function(roomName, costMatrix) {
                    if (roomName !== 'W24N56') {
                        if (originalCostCallback) {
                            return originalCostCallback(roomName, costMatrix);
                        }
                        return costMatrix;
                    }
                    
                    if (originalCostCallback) {
                        costMatrix = originalCostCallback(roomName, costMatrix) || costMatrix;
                    }
                    
                    for (let zone of zones) {
                        for (let dx = -zone.radius; dx <= zone.radius; dx++) {
                            for (let dy = -zone.radius; dy <= zone.radius; dy++) {
                                let x = zone.center.x + dx;
                                let y = zone.center.y + dy;
                                if (x < 0 || x > 49 || y < 0 || y > 49) continue;
                                let range = Math.max(Math.abs(dx), Math.abs(dy));
                                if (range <= zone.radius) {
                                    let currentCost = costMatrix.get(x, y);
                                    if (currentCost < 255) {
                                        costMatrix.set(x, y, 255);
                                    }
                                }
                            }
                        }
                    }
                    
                    return costMatrix;
                };
                
                return creep.moveTo(target, options);
            }
        }
        
        let options = this.getMoveOptions(creep, baseOptions);
        return creep.moveTo(target, options);
    },

    // Обрабатывает опасные зоны для крипа
    handleDangerZones: function(creep, zones) {
        if (creep.room.name !== 'W24N56') return false;
        if (!zones || zones.length === 0) return false;
        
        if (this.canBeInZone(creep)) return false;
        
        if (this.isInDangerZone(creep.pos, zones)) {
            let safePos = this.findSafePosition(creep, zones);
            if (safePos) {
                this.moveTo(creep, safePos, {
                    reusePath: 0,
                    dangerZones: zones,
                    visualizePathStyle: { stroke: '#ff0000', lineStyle: 'dashed' }
                });
                return true;
            }
        }
        
        return false;
    }
};

module.exports = creepMovement;

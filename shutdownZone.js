let shutdownZone = {
    ZONE_ROOM: 'W23N56',
    TARGET_ROOM: 'W24N56',
    ZONE_START: { x: 2, y: 34 },
    ZONE_END: { x: 6, y: 36 },
    SQUARE_START: { x: 4, y: 39 },
    SQUARE_END: { x: 7, y: 42 },
    COOLDOWN_TICKS: 20,
    MIN_HEALERS: 1,
    MIN_RANGED: 2,
    
    initMemory: function() {
        if (!Memory.shutdownZone) {
            Memory.shutdownZone = {
                active: false,
                occupiedPoints: {},
                lastDeactivate: 0,
                cooldownUntil: 0
            };
        }
    },
    
    isInZone: function(pos) {
        if (pos.roomName !== this.ZONE_ROOM) return false;
        return pos.x >= this.ZONE_START.x && 
               pos.x <= this.ZONE_END.x &&
               pos.y >= this.ZONE_START.y && 
               pos.y <= this.ZONE_END.y;
    },
    
    isInSquare: function(pos) {
        if (pos.roomName !== this.ZONE_ROOM) return false;
        return pos.x >= this.SQUARE_START.x && 
               pos.x <= this.SQUARE_END.x &&
               pos.y >= this.SQUARE_START.y && 
               pos.y <= this.SQUARE_END.y;
    },
    
    isSpecialRole: function(creep) {
        if (!creep || !creep.memory) return false;
        let role = creep.memory.role;
        return role === 'mammyTauer' || role === 'mammyRanged' || role === 'mammyHealer';
    },
    
    getOccupiedPoint: function(creep) {
        if (!Memory.shutdownZone.occupiedPoints) {
            Memory.shutdownZone.occupiedPoints = {};
        }
        return Memory.shutdownZone.occupiedPoints[creep.id] || null;
    },
    
    assignPoint: function(creep) {
        if (!Memory.shutdownZone.occupiedPoints) {
            Memory.shutdownZone.occupiedPoints = {};
        }
        
        let isSpecial = this.isSpecialRole(creep);
        let zoneStart = isSpecial ? this.ZONE_START : this.SQUARE_START;
        let zoneEnd = isSpecial ? this.ZONE_END : this.SQUARE_END;
        
        let occupied = new Set();
        for (let creepId in Memory.shutdownZone.occupiedPoints) {
            let point = Memory.shutdownZone.occupiedPoints[creepId];
            if (point) {
                occupied.add(`${point.x},${point.y}`);
            }
        }
        
        for (let y = zoneStart.y; y <= zoneEnd.y; y++) {
            let foundX = null;
            for (let x = zoneStart.x; x <= zoneEnd.x; x++) {
                let key = `${x},${y}`;
                if (occupied.has(key)) {
                    continue;
                }
                
                let pos = new RoomPosition(x, y, this.ZONE_ROOM);
                let creepsAtPos = pos.lookFor(LOOK_CREEPS);
                let hasOtherCreep = creepsAtPos.some(c => c.id !== creep.id && c.my);
                
                if (!hasOtherCreep) {
                    foundX = x;
                    break;
                }
            }
            
            if (foundX !== null) {
                Memory.shutdownZone.occupiedPoints[creep.id] = { x: foundX, y };
                return { x: foundX, y };
            }
        }
        
        return null;
    },
    
    releasePoint: function(creep) {
        if (!Memory.shutdownZone.occupiedPoints) return;
        delete Memory.shutdownZone.occupiedPoints[creep.id];
    },
    
    
    shouldActivate: function() {
        if (Game.time < Memory.shutdownZone.cooldownUntil) {
            return false;
        }
        
        let targetRoom = Game.rooms[this.TARGET_ROOM];
        if (!targetRoom) return false;
        
        let invaders = targetRoom.find(FIND_HOSTILE_CREEPS, {
            filter: h => h.name && (h.name.startsWith('invader') || h.name.toLowerCase().startsWith('invader'))
        });
        
        return invaders.length > 0;
    },
    
    shouldDeactivate: function() {
        if (!Memory.shutdownZone.active) return false;
        
        let targetRoom = Game.rooms[this.TARGET_ROOM];
        if (!targetRoom) return true;
        
        let invaders = targetRoom.find(FIND_HOSTILE_CREEPS, {
            filter: h => h.name && (h.name.startsWith('invader') || h.name.toLowerCase().startsWith('invader'))
        });
        
        return invaders.length === 0;
    },
    
    update: function() {
        this.initMemory();
        
        if (this.shouldDeactivate()) {
            Memory.shutdownZone.active = false;
            Memory.shutdownZone.lastDeactivate = Game.time;
            Memory.shutdownZone.cooldownUntil = Game.time + this.COOLDOWN_TICKS;
            Memory.shutdownZone.occupiedPoints = {};
            return;
        }
        
        if (this.shouldActivate()) {
            Memory.shutdownZone.active = true;
        }
        
        if (!Memory.shutdownZone.active) {
            Memory.shutdownZone.occupiedPoints = {};
            return;
        }
        
        for (let creepId in Memory.shutdownZone.occupiedPoints) {
            let creep = Game.creeps[creepId];
            if (!creep || !creep.room || creep.room.name !== this.ZONE_ROOM) {
                delete Memory.shutdownZone.occupiedPoints[creepId];
            }
        }
    },
    
    handleCreep: function(creep) {
        if (!Memory.shutdownZone.active) {
            this.releasePoint(creep);
            return false;
        }
        
        if (creep.memory.shutdownZoneTargetRoom) {
            if (creep.room.name === creep.memory.shutdownZoneTargetRoom) {
                delete creep.memory.shutdownZoneTargetRoom;
                this.releasePoint(creep);
                return false;
            }
            const creepMovement = require('./creepMovement');
            creepMovement.moveTo(creep, new RoomPosition(25, 25, creep.memory.shutdownZoneTargetRoom), {
                reusePath: 10
            });
            return true;
        }
        
        if (creep.room.name !== this.ZONE_ROOM) {
            this.releasePoint(creep);
            return false;
        }
        
        let isSpecial = this.isSpecialRole(creep);
        let isInFilterZone = this.isInZone(creep.pos);
        let isInSquareZone = this.isInSquare(creep.pos);
        let currentPoint = this.getOccupiedPoint(creep);
        
        if (isInFilterZone) {
            if (!isSpecial) {
                if (!currentPoint) {
                    currentPoint = this.assignPoint(creep);
                }
                if (currentPoint) {
                    let targetPos = new RoomPosition(currentPoint.x, currentPoint.y, this.ZONE_ROOM);
                    if (!creep.pos.isEqualTo(targetPos)) {
                        const creepMovement = require('./creepMovement');
                        creepMovement.moveTo(creep, targetPos, {
                            reusePath: 5
                        });
                    }
                }
                return true;
            } else {
                if (!currentPoint) {
                    currentPoint = this.assignPoint(creep);
                }
                if (currentPoint) {
                    let targetPos = new RoomPosition(currentPoint.x, currentPoint.y, this.ZONE_ROOM);
                    if (!creep.pos.isEqualTo(targetPos)) {
                        const creepMovement = require('./creepMovement');
                        creepMovement.moveTo(creep, targetPos, {
                            reusePath: 5
                        });
                    }
                }
                return true;
            }
        }
        
        if (isInSquareZone && !isSpecial && currentPoint) {
            let targetPos = new RoomPosition(currentPoint.x, currentPoint.y, this.ZONE_ROOM);
            if (!creep.pos.isEqualTo(targetPos)) {
                const creepMovement = require('./creepMovement');
                creepMovement.moveTo(creep, targetPos, {
                    reusePath: 5
                });
            }
            return true;
        }
        
        return false;
    }
};

module.exports = shutdownZone;

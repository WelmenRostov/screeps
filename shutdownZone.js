let shutdownZone = {
    ZONE_ROOM: 'W23N56',
    TARGET_ROOM: 'W24N56',
    ZONE_START: { x: 2, y: 34 },
    ZONE_END: { x: 5, y: 36 },
    INITIAL_POINTS: [
        { x: 2, y: 34 },
        { x: 2, y: 35 },
        { x: 2, y: 36 }
    ],
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
        
        let occupied = new Set();
        for (let creepId in Memory.shutdownZone.occupiedPoints) {
            let point = Memory.shutdownZone.occupiedPoints[creepId];
            if (point) {
                occupied.add(`${point.x},${point.y}`);
            }
        }
        
        for (let y = this.ZONE_START.y; y <= this.ZONE_END.y; y++) {
            let foundX = null;
            for (let x = this.ZONE_START.x; x <= this.ZONE_END.x; x++) {
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
            filter: h => h.name && h.name.startsWith('invader')
        });
        
        if (invaders.length <= 2) return false;
        
        let ranged = targetRoom.find(FIND_MY_CREEPS, {
            filter: c => c.memory && c.memory.role === 'mammyRanged'
        });
        
        return ranged.length === 0;
    },
    
    shouldDeactivate: function() {
        if (!Memory.shutdownZone.active) return false;
        
        let zoneRoom = Game.rooms[this.ZONE_ROOM];
        if (!zoneRoom) return false;
        
        let allCreeps = zoneRoom.find(FIND_MY_CREEPS);
        let creepsInZone = allCreeps.filter(c => {
            if (!c || !c.memory) return false;
            return this.isInZone(c.pos);
        });
        
        let healers = creepsInZone.filter(c => c.memory.role === 'mammyHealer');
        let ranged = creepsInZone.filter(c => c.memory.role === 'mammyRanged');
        
        return healers.length >= this.MIN_HEALERS && ranged.length >= this.MIN_RANGED;
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
        
        if (creep.room.name !== this.ZONE_ROOM) {
            this.releasePoint(creep);
            return false;
        }
        
        let currentPoint = this.getOccupiedPoint(creep);
        let isInZone = this.isInZone(creep.pos);
        
        if (!isInZone && !currentPoint) {
            return false;
        }
        
        if (!currentPoint) {
            currentPoint = this.assignPoint(creep);
            if (!currentPoint) {
                return false;
            }
        }
        
        let targetPos = new RoomPosition(currentPoint.x, currentPoint.y, this.ZONE_ROOM);
        
        if (!creep.pos.isEqualTo(targetPos)) {
            creep.moveTo(targetPos, {
                reusePath: 5,
                ignoreCreeps: false
            });
        }
        
        return true;
    }
};

module.exports = shutdownZone;


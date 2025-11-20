const creepMovement = require('./creepMovement');

let roleBobRemoteMinerW24N56 = {
    MINING_POSITIONS: [
        { x: 38, y: 12 },
        { x: 14, y: 43 },
        { x: 4, y: 15 }
    ],
    WAIT_POSITION: { x: 30, y: 33 },
    
    initMemory: function() {
        if (!Memory.bobRemoteMinerW24N56) {
            Memory.bobRemoteMinerW24N56 = {
                positions: {},
                lastCleanup: Game.time
            };
        }
        
        for (let pos of this.MINING_POSITIONS) {
            let posKey = `${pos.x},${pos.y}`;
            if (!Memory.bobRemoteMinerW24N56.positions[posKey]) {
                Memory.bobRemoteMinerW24N56.positions[posKey] = {
                    occupied: false,
                    creepId: null
                };
            }
        }
        
        if (Game.time - Memory.bobRemoteMinerW24N56.lastCleanup > 10) {
            for (let posKey in Memory.bobRemoteMinerW24N56.positions) {
                let posData = Memory.bobRemoteMinerW24N56.positions[posKey];
                if (posData.creepId && !Game.creeps[posData.creepId]) {
                    posData.occupied = false;
                    posData.creepId = null;
                }
            }
            Memory.bobRemoteMinerW24N56.lastCleanup = Game.time;
        }
    },
    
    findFreePosition: function(creep, targetRoom) {
        for (let pos of this.MINING_POSITIONS) {
            let posKey = `${pos.x},${pos.y}`;
            let posData = Memory.bobRemoteMinerW24N56.positions[posKey];
            
            if (!posData || !posData.occupied) {
                if (posData && posData.creepId && Game.creeps[posData.creepId]) {
                    continue;
                }
                
                let roomPos = new RoomPosition(pos.x, pos.y, targetRoom);
                let creepsAtPos = roomPos.lookFor(LOOK_CREEPS);
                let hasOtherMiner = creepsAtPos.some(c => 
                    c.id !== creep.id && 
                    c.memory && 
                    c.memory.role === 'bobRemoteMinerW24N56'
                );
                
                if (!hasOtherMiner) {
                    return pos;
                }
            }
        }
        
        return null;
    },
    
    occupyPosition: function(creep, pos, targetRoom) {
        if (!pos) return false;
        
        let posKey = `${pos.x},${pos.y}`;
        let posData = Memory.bobRemoteMinerW24N56.positions[posKey];
        
        if (posData && posData.occupied && posData.creepId !== creep.id) {
            if (Game.creeps[posData.creepId]) {
                return false;
            }
            posData.occupied = false;
            posData.creepId = null;
        }
        
        Memory.bobRemoteMinerW24N56.positions[posKey] = {
            occupied: true,
            creepId: creep.id
        };
        creep.memory.miningPos = pos;
        return true;
    },
    
    releasePosition: function(creep) {
        if (!creep.memory.miningPos) return;
        
        let pos = creep.memory.miningPos;
        let posKey = `${pos.x},${pos.y}`;
        
        if (Memory.bobRemoteMinerW24N56.positions[posKey]) {
            Memory.bobRemoteMinerW24N56.positions[posKey].occupied = false;
            Memory.bobRemoteMinerW24N56.positions[posKey].creepId = null;
        }
        
        creep.memory.miningPos = null;
    },
    
    run: function(creep) {
        this.initMemory();

        const targetRoom = creep.memory.targetRoom || 'W24N56';

        if (creep.room.name !== targetRoom) {
            creepMovement.moveTo(creep, new RoomPosition(25, 25, targetRoom), {
                reusePath: 10
            });
            return;
        }

        let miningPos = creep.memory.miningPos;
        let isOnMiningPos = miningPos && creep.pos.x === miningPos.x && creep.pos.y === miningPos.y;
        
        if (miningPos) {
            let posKey = `${miningPos.x},${miningPos.y}`;
            let posData = Memory.bobRemoteMinerW24N56.positions[posKey];
            
            if (!posData || posData.creepId !== creep.id) {
                this.releasePosition(creep);
                miningPos = null;
            } else {
                let roomPos = new RoomPosition(miningPos.x, miningPos.y, targetRoom);
                let creepsAtPos = roomPos.lookFor(LOOK_CREEPS);
                let hasOtherMiner = creepsAtPos.some(c => 
                    c.id !== creep.id && 
                    c.memory && 
                    c.memory.role === 'bobRemoteMinerW24N56'
                );
                
                if (hasOtherMiner) {
                    this.releasePosition(creep);
                    miningPos = null;
                }
            }
        }
        
        if (!miningPos) {
            let freePos = this.findFreePosition(creep, targetRoom);
            if (freePos && this.occupyPosition(creep, freePos, targetRoom)) {
                miningPos = freePos;
            }
        }

        if (!miningPos) {
            let waitPos = new RoomPosition(this.WAIT_POSITION.x, this.WAIT_POSITION.y, targetRoom);
            if (creep.pos.getRangeTo(waitPos) > 0) {
                creepMovement.moveTo(creep, waitPos, {
                    reusePath: 10,
                    range: 0
                });
            }
            return;
        }

        if (!isOnMiningPos) {
            let miningRoomPos = new RoomPosition(miningPos.x, miningPos.y, targetRoom);
            creepMovement.moveTo(creep, miningRoomPos, {
                reusePath: 10,
                range: 0
            });
            return;
        }

        let sources = creep.room.find(FIND_SOURCES);
        if (sources.length === 0) return;

        let closestSource = creep.pos.findClosestByRange(sources);
        if (closestSource) {
            if (creep.harvest(closestSource) === ERR_NOT_IN_RANGE) {
                creepMovement.moveTo(creep, closestSource, {
                    range: 1,
                    reusePath: 5
                });
            }
            
            if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
                creep.drop(RESOURCE_ENERGY);
            }
        }
    }
};

module.exports = roleBobRemoteMinerW24N56;

const creepMovement = require('./creepMovement');

let roleMammyTauer = {
    WATCH_POSITIONS: [
        { x: 36, y: 16 },
        { x: 16, y: 46 },
        { x: 6, y: 16 }
    ],
    
    SOURCE_KEEPERS: [
        { x: 7, y: 15 },
        { x: 38, y: 17 },
        { x: 17, y: 45 }
    ],
    
    getClosestKeeper: function(creep, targetRoom) {
        let closestKeeper = null;
        let minRange = Infinity;
        
        for (let keeperPos of this.SOURCE_KEEPERS) {
            let range = Math.abs(creep.pos.x - keeperPos.x) + Math.abs(creep.pos.y - keeperPos.y);
            if (range < minRange) {
                minRange = range;
                closestKeeper = new RoomPosition(keeperPos.x, keeperPos.y, targetRoom);
            }
        }
        
        return closestKeeper;
    },
    
    findMyPosition: function(creep, targetRoom) {
        if (creep.memory.watchPos) {
            let pos = creep.memory.watchPos;
            let roomPos = new RoomPosition(pos.x, pos.y, targetRoom);
            let creepsAtPos = roomPos.lookFor(LOOK_CREEPS);
            let hasOtherTauer = creepsAtPos.some(c => 
                c.id !== creep.id && 
                c.memory && 
                c.memory.role === 'mammyTauer'
            );
            
            if (!hasOtherTauer) {
                return pos;
            }
        }
        
        let allTauers = Object.values(Game.creeps).filter(c => 
            c.memory && 
            c.memory.role === 'mammyTauer' && 
            c.id !== creep.id &&
            c.room &&
            c.room.name === targetRoom &&
            c.memory.watchPos
        );
        
        let occupiedPositions = new Set();
        for (let tauer of allTauers) {
            if (tauer.memory.watchPos) {
                let posKey = `${tauer.memory.watchPos.x},${tauer.memory.watchPos.y}`;
                occupiedPositions.add(posKey);
            }
        }
        
        for (let pos of this.WATCH_POSITIONS) {
            let posKey = `${pos.x},${pos.y}`;
            if (!occupiedPositions.has(posKey)) {
                let roomPos = new RoomPosition(pos.x, pos.y, targetRoom);
                let creepsAtPos = roomPos.lookFor(LOOK_CREEPS);
                let hasOtherTauer = creepsAtPos.some(c => 
                    c.id !== creep.id && 
                    c.memory && 
                    c.memory.role === 'mammyTauer'
                );
                
                if (!hasOtherTauer) {
                    creep.memory.watchPos = pos;
                    return pos;
                }
            }
        }
        
        return null;
    },
    
    run: function(creep) {
        const targetRoom = 'W24N56';

        if (creep.room.name !== targetRoom) {
            creepMovement.moveTo(creep, new RoomPosition(25, 25, targetRoom), {
                reusePath: 20
            });
            return;
        }

        if (creep.ticksToLive <= 10 && creep.memory.watchPos) {
            let closestKeeper = this.getClosestKeeper(creep, targetRoom);
            if (closestKeeper) {
                let dx = closestKeeper.x - creep.pos.x;
                let dy = closestKeeper.y - creep.pos.y;
                let moveDir = null;
                if (Math.abs(dx) > Math.abs(dy)) {
                    moveDir = dx > 0 ? RIGHT : LEFT;
                } else {
                    moveDir = dy > 0 ? BOTTOM : TOP;
                }
                creep.move(moveDir);
            }
            creep.memory.watchPos = null;
            return;
        }

        let watchPos = this.findMyPosition(creep, targetRoom);

        if (!watchPos) {
            let centerPos = new RoomPosition(25, 25, targetRoom);
            creepMovement.moveTo(creep, centerPos, {
                reusePath: 10
            });
            return;
        }

        let watchRoomPos = new RoomPosition(watchPos.x, watchPos.y, targetRoom);
        let isOnWatchPos = creep.pos.x === watchPos.x && creep.pos.y === watchPos.y;
        
        let closestKeeper = this.getClosestKeeper(creep, targetRoom);
        if (!closestKeeper) {
            if (!isOnWatchPos) {
                creepMovement.moveTo(creep, watchRoomPos, {
                    reusePath: 10
                });
            }
            return;
        }

        let squadLeader = null;
        if (Memory.mammyRangedSquad && Memory.mammyRangedSquad[targetRoom]) {
            let leaderId = Memory.mammyRangedSquad[targetRoom].leaderId;
            if (leaderId) {
                squadLeader = Game.getObjectById(leaderId);
            }
        }
        
        let shouldHelpSquad = false;
        if (squadLeader && squadLeader.room && squadLeader.room.name === targetRoom && squadLeader.memory.assignedTargetId) {
            let leaderTarget = Game.getObjectById(squadLeader.memory.assignedTargetId);
            if (leaderTarget && leaderTarget.room && leaderTarget.room.name === targetRoom) {
                shouldHelpSquad = true;
            }
        }

        let hostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS);
        let keeperHostiles = hostileCreeps.filter(h => {
            let dx = h.pos.x - closestKeeper.x;
            let dy = h.pos.y - closestKeeper.y;
            return Math.abs(dx) + Math.abs(dy) <= 5;
        });

        if (shouldHelpSquad && squadLeader && squadLeader.memory.assignedTargetId) {
            let squadTarget = Game.getObjectById(squadLeader.memory.assignedTargetId);
            if (squadTarget && squadTarget.room && squadTarget.room.name === targetRoom) {
                let range = creep.pos.getRangeTo(squadTarget);
                
                if (range <= 1 && creep.getActiveBodyparts(ATTACK) > 0) {
                    creep.attack(squadTarget);
                } else if (range <= 3 && creep.getActiveBodyparts(RANGED_ATTACK) > 0) {
                    creep.rangedAttack(squadTarget);
                }
                
                if (range > 1) {
                    if (creep.getActiveBodyparts(ATTACK) > 0) {
                        creepMovement.moveTo(creep, squadTarget, {
                            range: 1,
                            reusePath: 5
                        });
                    } else if (creep.getActiveBodyparts(RANGED_ATTACK) > 0) {
                        creepMovement.moveTo(creep, squadTarget, {
                            range: 3,
                            reusePath: 5
                        });
                    }
                }
                return;
            }
        }

        if (keeperHostiles.length > 0) {
            let target = creep.pos.findClosestByRange(keeperHostiles);
            
            if (target) {
                let range = creep.pos.getRangeTo(target);
                
                if (range <= 1 && creep.getActiveBodyparts(ATTACK) > 0) {
                    creep.attack(target);
                } else if (range <= 3 && creep.getActiveBodyparts(RANGED_ATTACK) > 0) {
                    creep.rangedAttack(target);
                }
                
                if (range > 1) {
                    if (creep.getActiveBodyparts(ATTACK) > 0) {
                        creepMovement.moveTo(creep, target, {
                            range: 1,
                            reusePath: 5
                        });
                    } else if (creep.getActiveBodyparts(RANGED_ATTACK) > 0) {
                        creepMovement.moveTo(creep, target, {
                            range: 3,
                            reusePath: 5
                        });
                    }
                }
            }
        } else {
            if (!isOnWatchPos) {
                creepMovement.moveTo(creep, watchRoomPos, {
                    reusePath: 10
                });
            }
        }
    }
};

module.exports = roleMammyTauer;

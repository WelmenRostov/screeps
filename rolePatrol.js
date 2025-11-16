const creepMovement = require('./creepMovement');

let rolePatrol = {
    run: function(creep) {
        if (!creep || !creep.room) {
            return;
        }

        new RoomVisual(creep.room.name).text('🛡️', creep.pos.x, creep.pos.y - 0.55, { align: 'center', font: 0.5, opacity: 1 });

        if (!creep.memory.patrolPos) {
            return;
        }

        let patrolPos = creep.memory.patrolPos;
        let patrolRoom = patrolPos.roomName || creep.memory.homeRoom || creep.room.name;
        
        if (!patrolRoom || typeof patrolPos.x !== 'number' || typeof patrolPos.y !== 'number') {
            return;
        }

        let targetPos = new RoomPosition(patrolPos.x, patrolPos.y, patrolRoom);
        
        if (!targetPos) {
            return;
        }

        if (creep.room.name !== patrolRoom) {
            creepMovement.moveTo(creep, targetPos, { reusePath: 20, visualizePathStyle: { stroke: '#00ffff' } });
            return;
        }

        let hostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS);
        let hostilePowerCreeps = creep.room.find(FIND_HOSTILE_POWER_CREEPS);
        let hostileStructures = creep.room.find(FIND_HOSTILE_STRUCTURES, {
            filter: (s) => s.structureType !== STRUCTURE_POWER_BANK
        });

        if (hostileCreeps.length > 0) {
            let target = null;

            let attackingCreeps = hostileCreeps.filter(c => 
                c.getActiveBodyparts(ATTACK) > 0 || c.getActiveBodyparts(RANGED_ATTACK) > 0
            );

            if (attackingCreeps.length > 0) {
                target = creep.pos.findClosestByPath(attackingCreeps);
            } else if (hostileCreeps.length > 0) {
                target = creep.pos.findClosestByPath(hostileCreeps);
            } else if (hostileStructures.length > 0) {
                let towers = hostileStructures.filter(s => s.structureType === STRUCTURE_TOWER);
                let spawns = hostileStructures.filter(s => s.structureType === STRUCTURE_SPAWN);
                let otherStructures = hostileStructures.filter(s => 
                    s.structureType !== STRUCTURE_TOWER && 
                    s.structureType !== STRUCTURE_SPAWN &&
                    s.structureType !== STRUCTURE_ROAD &&
                    s.structureType !== STRUCTURE_CONTAINER
                );
                
                if (towers.length > 0) {
                    target = creep.pos.findClosestByPath(towers);
                } else if (spawns.length > 0) {
                    target = creep.pos.findClosestByPath(spawns);
                } else if (otherStructures.length > 0) {
                    target = creep.pos.findClosestByPath(otherStructures);
                } else {
                    target = creep.pos.findClosestByPath(hostileStructures);
                }
            }

            if (target) {
                let range = creep.pos.getRangeTo(target);
                let isStructure = target.structureType !== undefined;
                let targetHasMelee = false;
                
                if (!isStructure) {
                    if (target.getActiveBodyparts) {
                        targetHasMelee = target.getActiveBodyparts(ATTACK) > 0;
                    } else if (target.body) {
                        targetHasMelee = target.body.some(part => part.type === ATTACK && part.hits > 0);
                    }
                }
                
                if (isStructure) {
                    if (range <= 1 && creep.getActiveBodyparts(ATTACK) > 0) {
                        creep.attack(target);
                    } else if (range <= 3 && creep.getActiveBodyparts(RANGED_ATTACK) > 0) {
                        creep.rangedAttack(target);
                    }
                    
                    if (range > 1) {
                        if (creep.getActiveBodyparts(ATTACK) > 0) {
                            creepMovement.moveTo(creep, target, { range: 1, reusePath: 5, visualizePathStyle: { stroke: '#ff0000' } });
                        } else if (creep.getActiveBodyparts(RANGED_ATTACK) > 0) {
                            creepMovement.moveTo(creep, target, { range: 3, reusePath: 5, visualizePathStyle: { stroke: '#ff0000' } });
                        }
                    }
                    return;
                }
                
                if (targetHasMelee) {
                    if (range <= 3 && creep.getActiveBodyparts(RANGED_ATTACK) > 0) {
                        creep.rangedAttack(target);
                    }
                    
                    if (range <= 2) {
                        let direction = creep.pos.getDirectionTo(target);
                        let oppositeDirection = ((direction + 3) % 8) || 8;
                        creep.move(oppositeDirection);
                    } else if (range > 3 && creep.getActiveBodyparts(RANGED_ATTACK) > 0) {
                        creepMovement.moveTo(creep, target, { range: 3, reusePath: 5, visualizePathStyle: { stroke: '#ff0000' } });
                    } else if (creep.getActiveBodyparts(RANGED_ATTACK) > 0) {
                        creepMovement.moveTo(creep, target, { range: 3, reusePath: 5, visualizePathStyle: { stroke: '#ff0000' } });
                    }
                    return;
                }
                
                if (!targetHasMelee) {
                    if (range <= 1 && creep.getActiveBodyparts(ATTACK) > 0) {
                        creep.attack(target);
                        return;
                    }
                    
                    if (range <= 3 && creep.getActiveBodyparts(RANGED_ATTACK) > 0) {
                        creep.rangedAttack(target);
                    }
                    
                    if (creep.getActiveBodyparts(ATTACK) > 0) {
                        creepMovement.moveTo(creep, target, { range: 1, reusePath: 5, visualizePathStyle: { stroke: '#ff0000' } });
                    } else if (creep.getActiveBodyparts(RANGED_ATTACK) > 0 && range > 3) {
                        creepMovement.moveTo(creep, target, { range: 3, reusePath: 5, visualizePathStyle: { stroke: '#ff0000' } });
                    }
                    return;
                }
            }
        }

        if (hostilePowerCreeps.length > 0) {
            let target = creep.pos.findClosestByPath(hostilePowerCreeps);
            
            if (target) {
                let range = creep.pos.getRangeTo(target);
                let targetHasMelee = false;
                
                if (target.getActiveBodyparts) {
                    targetHasMelee = target.getActiveBodyparts(ATTACK) > 0;
                }
                
                if (targetHasMelee) {
                    if (range <= 3 && creep.getActiveBodyparts(RANGED_ATTACK) > 0) {
                        creep.rangedAttack(target);
                    }
                    
                    if (range <= 2) {
                        let direction = creep.pos.getDirectionTo(target);
                        let oppositeDirection = ((direction + 3) % 8) || 8;
                        creep.move(oppositeDirection);
                    } else if (range > 3 && creep.getActiveBodyparts(RANGED_ATTACK) > 0) {
                        creepMovement.moveTo(creep, target, { range: 3, reusePath: 5, visualizePathStyle: { stroke: '#ff0000' } });
                    } else if (creep.getActiveBodyparts(RANGED_ATTACK) > 0) {
                        creepMovement.moveTo(creep, target, { range: 3, reusePath: 5, visualizePathStyle: { stroke: '#ff0000' } });
                    }
                    return;
                }
                
                if (!targetHasMelee) {
                    if (range <= 1 && creep.getActiveBodyparts(ATTACK) > 0) {
                        creep.attack(target);
                        return;
                    }
                    
                    if (range <= 3 && creep.getActiveBodyparts(RANGED_ATTACK) > 0) {
                        creep.rangedAttack(target);
                    }
                    
                    if (creep.getActiveBodyparts(ATTACK) > 0) {
                        creepMovement.moveTo(creep, target, { range: 1, reusePath: 5, visualizePathStyle: { stroke: '#ff0000' } });
                    } else if (creep.getActiveBodyparts(RANGED_ATTACK) > 0 && range > 3) {
                        creepMovement.moveTo(creep, target, { range: 3, reusePath: 5, visualizePathStyle: { stroke: '#ff0000' } });
                    }
                    return;
                }
            }
        }

        if (hostileStructures.length > 0) {
            let target = null;

            let towers = hostileStructures.filter(s => s.structureType === STRUCTURE_TOWER);
            let spawns = hostileStructures.filter(s => s.structureType === STRUCTURE_SPAWN);
            let otherStructures = hostileStructures.filter(s => 
                s.structureType !== STRUCTURE_TOWER && 
                s.structureType !== STRUCTURE_SPAWN &&
                s.structureType !== STRUCTURE_ROAD &&
                s.structureType !== STRUCTURE_CONTAINER &&
                s.structureType !== STRUCTURE_POWER_BANK
            );
            
            if (towers.length > 0) {
                target = creep.pos.findClosestByPath(towers);
            } else if (spawns.length > 0) {
                target = creep.pos.findClosestByPath(spawns);
            } else if (otherStructures.length > 0) {
                target = creep.pos.findClosestByPath(otherStructures);
            } else {
                let filteredStructures = hostileStructures.filter(s => s.structureType !== STRUCTURE_POWER_BANK);
                if (filteredStructures.length > 0) {
                    target = creep.pos.findClosestByPath(filteredStructures);
                }
            }

            if (target) {
                let range = creep.pos.getRangeTo(target);
                
                if (range <= 1 && creep.getActiveBodyparts(ATTACK) > 0) {
                    creep.attack(target);
                } else if (range <= 3 && creep.getActiveBodyparts(RANGED_ATTACK) > 0) {
                    creep.rangedAttack(target);
                }
                
                if (range > 1) {
                    if (creep.getActiveBodyparts(ATTACK) > 0) {
                        creepMovement.moveTo(creep, target, { range: 1, reusePath: 5, visualizePathStyle: { stroke: '#ff0000' } });
                    } else if (creep.getActiveBodyparts(RANGED_ATTACK) > 0) {
                        creepMovement.moveTo(creep, target, { range: 3, reusePath: 5, visualizePathStyle: { stroke: '#ff0000' } });
                    }
                }
                return;
            }
        }

        if (creep.hits < creep.hitsMax) {
            creep.heal(creep);
            return;
        }

        if (creep.pos.getRangeTo(targetPos) > 3) {
            creepMovement.moveTo(creep, targetPos, { range: 3, reusePath: 10, visualizePathStyle: { stroke: '#00ffff' } });
        }
    }
};

module.exports = rolePatrol;


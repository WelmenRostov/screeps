const creepMovement = require('./creepMovement');

let roleMammyRanged = {
    CACHE_TTL: 1,
    
    initMemory: function(targetRoom) {
        if (!Memory.mammyRangedSquad) {
            Memory.mammyRangedSquad = {};
        }
        if (!Memory.mammyRangedSquad[targetRoom]) {
            Memory.mammyRangedSquad[targetRoom] = {
                leaderId: null,
                lastUpdate: 0,
                cache: {
                    rangedCreeps: null,
                    invaderCreeps: null,
                    hasHealer: null,
                    cacheTick: 0
                }
            };
        }
    },
    
    getRangedCreeps: function(targetRoom) {
        let squad = Memory.mammyRangedSquad[targetRoom];
        if (!squad) {
            this.initMemory(targetRoom);
            squad = Memory.mammyRangedSquad[targetRoom];
        }
        if (!squad.cache || squad.cache.cacheTick !== Game.time) {
            if (!squad.cache) {
                squad.cache = {
                    rangedCreeps: null,
                    invaderCreeps: null,
                    hasHealer: null,
                    cacheTick: 0
                };
            }
            squad.cache.rangedCreeps = Object.values(Game.creeps).filter(c => 
                c.memory && 
                c.memory.role === 'mammyRanged' && 
                c.room && 
                c.room.name === targetRoom
            );
            squad.cache.cacheTick = Game.time;
        }
        return squad.cache.rangedCreeps || [];
    },
    
    getInvaderCreeps: function(room) {
        if (!room) return [];
        let targetRoom = room.name;
        let squad = Memory.mammyRangedSquad[targetRoom];
        if (!squad) {
            this.initMemory(targetRoom);
            squad = Memory.mammyRangedSquad[targetRoom];
        }
        if (!squad.cache || squad.cache.cacheTick !== Game.time) {
            if (!squad.cache) {
                squad.cache = {
                    rangedCreeps: null,
                    invaderCreeps: null,
                    hasHealer: null,
                    cacheTick: 0
                };
            }
            squad.cache.invaderCreeps = room.find(FIND_HOSTILE_CREEPS, {
                filter: h => h.name && (h.name.startsWith('Keeper') || h.name.startsWith('invader'))
            });
            squad.cache.cacheTick = Game.time;
        }
        return squad.cache.invaderCreeps || [];
    },

    getKeeperCreeps: function(room) {
        if (!room) return [];
        let hostiles = room.find(FIND_HOSTILE_CREEPS);
        return hostiles.filter(h => h.name && h.name.startsWith('Keeper'));
    },

    hasEnemyHealer: function(room) {
        if (!room) return false;
        let targetRoom = room.name;
        let squad = Memory.mammyRangedSquad[targetRoom];
        if (!squad) {
            this.initMemory(targetRoom);
            squad = Memory.mammyRangedSquad[targetRoom];
        }
        if (!squad.cache || squad.cache.cacheTick !== Game.time) {
            if (!squad.cache) {
                squad.cache = {
                    rangedCreeps: null,
                    invaderCreeps: null,
                    hasHealer: null,
                    cacheTick: 0
                };
            }
            let hostiles = room.find(FIND_HOSTILE_CREEPS);
            squad.cache.hasHealer = hostiles.some(h => h.getActiveBodyparts(HEAL) > 0);
            squad.cache.cacheTick = Game.time;
        }
        return squad.cache.hasHealer || false;
    },

    selectLeader: function(targetRoom) {
        let squad = Memory.mammyRangedSquad[targetRoom];
        if (!squad) {
            this.initMemory(targetRoom);
            squad = Memory.mammyRangedSquad[targetRoom];
        }
        if (squad && Game.time - squad.lastUpdate < this.CACHE_TTL && squad.leaderId && Game.creeps[squad.leaderId]) {
            return Game.creeps[squad.leaderId];
        }

        let rangedCreeps = this.getRangedCreeps(targetRoom);
        if (!rangedCreeps || rangedCreeps.length === 0) return null;

        let leader = rangedCreeps[0];
        for (let c of rangedCreeps) {
            if (c && c.ticksToLive && leader && leader.ticksToLive && c.ticksToLive > leader.ticksToLive) {
                leader = c;
            }
        }

        if (leader) {
            squad.leaderId = leader.id;
            squad.lastUpdate = Game.time;
        }
        return leader;
    },

    isLeader: function(creep, targetRoom) {
        let leader = this.selectLeader(targetRoom);
        return leader && leader.id === creep.id;
    },

    getLeader: function(targetRoom) {
        return this.selectLeader(targetRoom);
    },

    getTargets: function(creep, leader, invaderCreeps, hasHealer, allRanged) {
        if (!invaderCreeps || invaderCreeps.length === 0) return null;
        if (!leader || !leader.pos) return null;
        if (!allRanged) allRanged = [];

        if (hasHealer) {
            let targetsInRange = invaderCreeps.filter(h =>
                h && h.pos && leader.pos.getRangeTo(h) <= 8
            );

            if (targetsInRange.length === 0) {
                let fallbackTarget = leader.pos.findClosestByRange(invaderCreeps);
                if (fallbackTarget) {
                    creep.memory.assignedTargetId = fallbackTarget.id;
                }
                return fallbackTarget;
            }

            let targetAssignments = {};
            for (let r of allRanged) {
                if (!r) continue;
                if (r.memory && r.memory.assignedTargetId) {
                    let assignedTarget = Game.getObjectById(r.memory.assignedTargetId);
                    if (assignedTarget && targetsInRange.find(t => t.id === assignedTarget.id)) {
                        let targetId = assignedTarget.id;
                        targetAssignments[targetId] = (targetAssignments[targetId] || 0) + 1;
                    }
                }
            }

            let allTargets = targetsInRange.slice();
            allTargets.sort((a, b) => {
                let aAttackers = targetAssignments[a.id] || 0;
                let bAttackers = targetAssignments[b.id] || 0;
                if (aAttackers !== bAttackers) {
                    return aAttackers - bAttackers;
                }
                return creep.pos.getRangeTo(a) - creep.pos.getRangeTo(b);
            });

            let myTarget = allTargets[0];
            if (myTarget) {
                creep.memory.assignedTargetId = myTarget.id;
            }
            return myTarget;
        } else {
            let leaderTarget = leader.pos.findClosestByRange(invaderCreeps);
            if (leaderTarget) {
                creep.memory.assignedTargetId = leaderTarget.id;
            }
            return leaderTarget;
        }
    },

    getAssignedPosition: function(creep, leader, allRanged) {
        if (!creep || !creep.pos || !leader || !leader.pos) return null;

        let followerIndex = 0;
        for (let r of allRanged) {
            if (r.id === leader.id) continue;
            if (r.id === creep.id) break;
            followerIndex++;
        }

        let positions = [
            { dx: -1, dy: -1 },
            { dx: 0, dy: -1 },
            { dx: 1, dy: -1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 },
            { dx: -1, dy: 1 },
            { dx: 0, dy: 1 },
            { dx: 1, dy: 1 }
        ];

        let assignedIndex = followerIndex % positions.length;
        let targetOffset = positions[assignedIndex];

        let targetX = leader.pos.x + targetOffset.dx;
        let targetY = leader.pos.y + targetOffset.dy;

        if (targetX < 0 || targetX > 49 || targetY < 0 || targetY > 49) {
            return null;
        }

        let targetPos = new RoomPosition(targetX, targetY, leader.room.name);
        let terrain = targetPos.lookFor(LOOK_TERRAIN)[0];
        if (terrain === 'wall') {
            return null;
        }

        return targetPos;
    },

    moveToLeader: function(creep, leader, allRanged) {
        if (!creep || !creep.pos || !leader || !leader.pos) return;

        let followerToLeaderDx = creep.pos.x - leader.pos.x;
        let followerToLeaderDy = creep.pos.y - leader.pos.y;
        let rangeToLeader = Math.max(Math.abs(followerToLeaderDx), Math.abs(followerToLeaderDy));

        if (rangeToLeader === 1 && leader.memory.assignedTargetId) {
            let leaderTarget = Game.getObjectById(leader.memory.assignedTargetId);
            if (leaderTarget && leaderTarget.pos) {
                let leaderToTargetDx = leaderTarget.pos.x - leader.pos.x;
                let leaderToTargetDy = leaderTarget.pos.y - leader.pos.y;

                let nextStepDx = 0;
                let nextStepDy = 0;
                if (Math.abs(leaderToTargetDx) > Math.abs(leaderToTargetDy)) {
                    nextStepDx = leaderToTargetDx > 0 ? 1 : -1;
                } else if (leaderToTargetDy !== 0) {
                    nextStepDy = leaderToTargetDy > 0 ? 1 : -1;
                } else if (leaderToTargetDx !== 0) {
                    nextStepDx = leaderToTargetDx > 0 ? 1 : -1;
                }

                let nextStepX = leader.pos.x + nextStepDx;
                let nextStepY = leader.pos.y + nextStepDy;

                if (creep.pos.x === nextStepX && creep.pos.y === nextStepY) {
                    let directions = [
                        { dir: TOP, dx: 0, dy: -1 },
                        { dir: TOP_RIGHT, dx: 1, dy: -1 },
                        { dir: RIGHT, dx: 1, dy: 0 },
                        { dir: BOTTOM_RIGHT, dx: 1, dy: 1 },
                        { dir: BOTTOM, dx: 0, dy: 1 },
                        { dir: BOTTOM_LEFT, dx: -1, dy: 1 },
                        { dir: LEFT, dx: -1, dy: 0 },
                        { dir: TOP_LEFT, dx: -1, dy: -1 }
                    ];

                    let retreatDirs = [];
                    for (let { dir, dx, dy } of directions) {
                        if (dx === nextStepDx && dy === nextStepDy) continue;

                        let checkX = creep.pos.x + dx;
                        let checkY = creep.pos.y + dy;
                        let checkPos = new RoomPosition(checkX, checkY, creep.room.name);
                        let terrain = checkPos.lookFor(LOOK_TERRAIN)[0];
                        let creepsAtPos = checkPos.lookFor(LOOK_CREEPS);
                        let hasOtherCreep = creepsAtPos.some(c => c.id !== creep.id && c.id !== leader.id);

                        if (terrain !== 'wall' && !hasOtherCreep) {
                            retreatDirs.push(dir);
                        }
                    }

                    if (retreatDirs.length > 0) {
                        let retreatDir = retreatDirs[Math.floor(Math.random() * retreatDirs.length)];
                        creep.move(retreatDir);
                        return;
                    }
                }
            }
        }

        let targetPos = this.getAssignedPosition(creep, leader, allRanged);
        if (!targetPos) {
            let range = creep.pos.getRangeTo(leader);
            if (range > 1) {
                creepMovement.moveTo(creep, leader, {
                    range: 1,
                    reusePath: 5
                });
            }
            return;
        }

        if (creep.pos.isEqualTo(targetPos)) {
            return;
        }

        creepMovement.moveTo(creep, targetPos, {
            range: 0,
            reusePath: 5
        });
    },

    isSquadReady: function(leader, allRanged) {
        if (!leader || !leader.pos || !allRanged || allRanged.length <= 1) return true;

        let maxRange = 3;
        for (let follower of allRanged) {
            if (follower.id === leader.id) continue;
            if (!follower.pos) continue;

            let range = leader.pos.getRangeTo(follower);
            if (range > maxRange) {
                return false;
            }
        }

        return true;
    },

    attackTarget: function(creep, target, isLeader, allRanged) {
        if (!creep || !creep.pos || !target || !target.pos) return;

        if (!isLeader && allRanged && allRanged.length > 1) {
            let targetRoom = creep.memory.targetRoom || creep.room.name;
            let squad = Memory.mammyRangedSquad && Memory.mammyRangedSquad[targetRoom];
            if (squad && squad.leaderId) {
                let leader = Game.getObjectById(squad.leaderId);
                if (leader && leader.pos && leader.memory.assignedTargetId) {
                    let leaderTarget = Game.getObjectById(leader.memory.assignedTargetId);
                    if (leaderTarget && leaderTarget.pos) {
                        let leaderToTargetDx = leaderTarget.pos.x - leader.pos.x;
                        let leaderToTargetDy = leaderTarget.pos.y - leader.pos.y;

                        let nextStepDx = 0;
                        let nextStepDy = 0;
                        if (Math.abs(leaderToTargetDx) > Math.abs(leaderToTargetDy)) {
                            nextStepDx = leaderToTargetDx > 0 ? 1 : -1;
                        } else if (leaderToTargetDy !== 0) {
                            nextStepDy = leaderToTargetDy > 0 ? 1 : -1;
                        } else if (leaderToTargetDx !== 0) {
                            nextStepDx = leaderToTargetDx > 0 ? 1 : -1;
                        }

                        let nextStepX = leader.pos.x + nextStepDx;
                        let nextStepY = leader.pos.y + nextStepDy;

                        if (creep.pos.x === nextStepX && creep.pos.y === nextStepY) {
                            let directions = [
                                { dir: TOP, dx: 0, dy: -1 },
                                { dir: TOP_RIGHT, dx: 1, dy: -1 },
                                { dir: RIGHT, dx: 1, dy: 0 },
                                { dir: BOTTOM_RIGHT, dx: 1, dy: 1 },
                                { dir: BOTTOM, dx: 0, dy: 1 },
                                { dir: BOTTOM_LEFT, dx: -1, dy: 1 },
                                { dir: LEFT, dx: -1, dy: 0 },
                                { dir: TOP_LEFT, dx: -1, dy: -1 }
                            ];

                            let retreatDirs = [];
                            for (let { dir, dx, dy } of directions) {
                                if (dx === nextStepDx && dy === nextStepDy) continue;

                                let checkX = creep.pos.x + dx;
                                let checkY = creep.pos.y + dy;
                                let checkPos = new RoomPosition(checkX, checkY, creep.room.name);
                                let terrain = checkPos.lookFor(LOOK_TERRAIN)[0];
                                let creepsAtPos = checkPos.lookFor(LOOK_CREEPS);
                                let hasOtherCreep = creepsAtPos.some(c => c.id !== creep.id && c.id !== leader.id);

                                if (terrain !== 'wall' && !hasOtherCreep) {
                                    retreatDirs.push(dir);
                                }
                            }

                            if (retreatDirs.length > 0) {
                                let retreatDir = retreatDirs[Math.floor(Math.random() * retreatDirs.length)];
                                creep.move(retreatDir);
                                return;
                            }
                        }
                    }
                }
            }
        }

        let range = creep.pos.getRangeTo(target);

        if (range <= 3) {
            creep.rangedAttack(target);
        }

        if (isLeader) {
            if (!target || !target.pos || !target.room || target.hits <= 0) {
                if (creep.memory.assignedTargetId) {
                    creep.memory.assignedTargetId = null;
                }
                return;
            }

            if (target.room.name !== creep.room.name) {
                if (creep.memory.assignedTargetId) {
                    creep.memory.assignedTargetId = null;
                }
                return;
            }

            let squadReady = this.isSquadReady(creep, allRanged);

            if (range < 2) {
                creepMovement.moveTo(creep, target, {
                    range: 2,
                    reusePath: 5
                });
            } else if (range > 3) {
                if (squadReady) {
                    creepMovement.moveTo(creep, target, {
                        range: 3,
                        reusePath: 5
                    });
                }
            }
        } else {
            if (range < 2) {
                creepMovement.moveTo(creep, target, {
                    range: 2,
                    reusePath: 5
                });
            } else if (range > 3) {
                creepMovement.moveTo(creep, target, {
                    range: 3,
                    reusePath: 5
                });
            }
        }
    },

    run: function(creep) {
        const targetRoom = creep.memory.targetRoom || 'W24N56';
        const centerPos = new RoomPosition(28, 29, targetRoom);

        if (creep.room.name !== targetRoom) {
            creepMovement.moveTo(creep, centerPos, {
                reusePath: 20
            });
            return;
        }

        this.initMemory(targetRoom);

        let hostilesInRange = creep.room.find(FIND_HOSTILE_CREEPS, {
            filter: h => creep.pos.getRangeTo(h) <= 3
        });

        if (hostilesInRange.length > 0) {
            creep.rangedAttack();
        }

        let rangedCreeps = this.getRangedCreeps(targetRoom);

        if (rangedCreeps.length <= 1) {
            let keeperCreeps = this.getKeeperCreeps(creep.room);
            let invaderCreeps = creep.room.find(FIND_HOSTILE_CREEPS, {
                filter: h => h.name && (h.name.startsWith('Keeper') || h.name.startsWith('invader'))
            });

            if (keeperCreeps.length > 0) {
                let target = creep.pos.findClosestByRange(keeperCreeps);
                this.attackTarget(creep, target, true, [creep]);
                return;
            }
            
            if (invaderCreeps.length > 0) {
                let target = creep.pos.findClosestByRange(invaderCreeps);
                this.attackTarget(creep, target, true, [creep]);
                return;
            }

            if (creep.pos.getRangeTo(centerPos) > 0) {
                creepMovement.moveTo(creep, centerPos, {
                    reusePath: 10,
                    range: 0
                });
            }
            return;
        }

        let leader = this.getLeader(targetRoom);
        
        if (!leader || !leader.room || leader.room.name !== targetRoom) {
            this.selectLeader(targetRoom);
            leader = this.getLeader(targetRoom);
        }
        
        let isLeader = this.isLeader(creep, targetRoom);
        
        if (leader && leader.room && leader.room.name === targetRoom) {
            if (!isLeader) {
                let leaderTarget = null;
                if (leader.memory.assignedTargetId) {
                    let leaderTargetObj = Game.getObjectById(leader.memory.assignedTargetId);
                    if (leaderTargetObj && leaderTargetObj.pos && leaderTargetObj.room && leaderTargetObj.room.name === leader.room.name) {
                        leaderTarget = leaderTargetObj;
                    }
                }
                
                if (leaderTarget) {
                    let invaderCreeps = this.getInvaderCreeps(creep.room);
                    let keeperCreeps = this.getKeeperCreeps(creep.room);
                    let allTargets = [...keeperCreeps, ...invaderCreeps.filter(h => !keeperCreeps.find(k => k.id === h.id))];
                    
                    if (allTargets.length > 0) {
                        let hasHealer = this.hasEnemyHealer(creep.room);
                        let myTarget = this.getTargets(creep, leader, allTargets, hasHealer, rangedCreeps);
                        if (myTarget && myTarget.pos && myTarget.room && myTarget.room.name === creep.room.name) {
                            creep.memory.assignedTargetId = myTarget.id;
                            this.attackTarget(creep, myTarget, false, rangedCreeps);
                        } else {
                            this.moveToLeader(creep, leader, rangedCreeps);
                        }
                    } else {
                        this.moveToLeader(creep, leader, rangedCreeps);
                    }
                } else {
                    this.moveToLeader(creep, leader, rangedCreeps);
                }
                return;
            }
        } else {
            if (creep.pos.getRangeTo(centerPos) > 0) {
                creepMovement.moveTo(creep, centerPos, {
                    reusePath: 10,
                    range: 0
                });
            }
            return;
        }
        let invaderCreeps = this.getInvaderCreeps(creep.room);
        let keeperCreeps = this.getKeeperCreeps(creep.room);
        let allTargets = [...keeperCreeps, ...invaderCreeps.filter(h => !keeperCreeps.find(k => k.id === h.id))];
        let hasHealer = this.hasEnemyHealer(creep.room);

        if (allTargets.length > 0) {
            let target = null;
            
            if (isLeader) {
                if (creep.memory.assignedTargetId) {
                    let assignedTarget = Game.getObjectById(creep.memory.assignedTargetId);
                    if (assignedTarget && assignedTarget.pos && assignedTarget.room && assignedTarget.room.name === creep.room.name && assignedTarget.hits > 0) {
                        let targetInList = allTargets.find(h => h.id === assignedTarget.id);
                        if (targetInList) {
                            target = assignedTarget;
                        } else {
                            creep.memory.assignedTargetId = null;
                        }
                    } else {
                        creep.memory.assignedTargetId = null;
                    }
                }
                
                if (!target) {
                    if (keeperCreeps.length > 0) {
                        target = creep.pos.findClosestByRange(keeperCreeps);
                    } else if (invaderCreeps.length > 0) {
                        target = creep.pos.findClosestByRange(invaderCreeps);
                    }
                }
                
                if (target && target.hits > 0) {
                    let currentRange = creep.pos.getRangeTo(target);
                    if (currentRange <= 3) {
                        creep.rangedAttack(target);
                    }
                    creep.memory.assignedTargetId = target.id;
                    this.attackTarget(creep, target, true, rangedCreeps);
                } else {
                    creep.memory.assignedTargetId = null;
                }
            } else {
                let targetsInAttackRange = allTargets.filter(t => 
                    t && t.pos && t.room && 
                    t.room.name === creep.room.name && 
                    creep.pos.getRangeTo(t) <= 3
                );
                
                if (targetsInAttackRange.length > 0) {
                    let targetToAttack = null;
                    if (creep.memory.assignedTargetId) {
                        targetToAttack = targetsInAttackRange.find(t => t.id === creep.memory.assignedTargetId);
                    }
                    if (!targetToAttack) {
                        targetToAttack = creep.pos.findClosestByRange(targetsInAttackRange);
                        if (targetToAttack) {
                            creep.memory.assignedTargetId = targetToAttack.id;
                        }
                    }
                    
                    if (targetToAttack) {
                        creep.rangedAttack(targetToAttack);
                    }
                }
                
                let leaderTarget = null;
                if (leader.memory.assignedTargetId) {
                    let leaderTargetObj = Game.getObjectById(leader.memory.assignedTargetId);
                    if (leaderTargetObj && leaderTargetObj.pos && leaderTargetObj.room && leaderTargetObj.room.name === leader.room.name) {
                        leaderTarget = leaderTargetObj;
                    }
                }
                
                let myTarget = null;
                if (leaderTarget) {
                    let leaderKeeperCreeps = this.getKeeperCreeps(leader.room);
                    if (leaderKeeperCreeps.length > 0) {
                        myTarget = creep.pos.findClosestByRange(leaderKeeperCreeps);
                    }
                    if (!myTarget) {
                        let leaderAllTargets = [...leaderKeeperCreeps, ...invaderCreeps.filter(h => !leaderKeeperCreeps.find(k => k.id === h.id))];
                        myTarget = this.getTargets(creep, leader, leaderAllTargets, hasHealer, rangedCreeps);
                    }
                } else {
                    let leaderKeeperCreeps = this.getKeeperCreeps(leader.room);
                    if (leaderKeeperCreeps.length > 0) {
                        myTarget = creep.pos.findClosestByRange(leaderKeeperCreeps);
                    }
                    if (!myTarget) {
                        let leaderAllTargets = [...leaderKeeperCreeps, ...invaderCreeps.filter(h => !leaderKeeperCreeps.find(k => k.id === h.id))];
                        myTarget = this.getTargets(creep, leader, leaderAllTargets, hasHealer, rangedCreeps);
                    }
                }
                
                if (myTarget && myTarget.pos && myTarget.room && myTarget.room.name === creep.room.name) {
                    creep.memory.assignedTargetId = myTarget.id;
                    this.attackTarget(creep, myTarget, false, rangedCreeps);
                } else {
                    this.moveToLeader(creep, leader, rangedCreeps);
                }
            }
            return;
        }
        
        creep.memory.assignedTargetId = null;

        if (isLeader) {
            if (creep.pos.getRangeTo(centerPos) > 0) {
                creepMovement.moveTo(creep, centerPos, {
                    reusePath: 10,
                    range: 0
                });
            }
        } else {
            this.moveToLeader(creep, leader, rangedCreeps);
        }
    }
};

module.exports = roleMammyRanged;


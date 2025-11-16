const creepMovement = require('./creepMovement');

let roleAttacker = {
    run: function(creep) {
        new RoomVisual(creep.room.name).text('❌', creep.pos.x, creep.pos.y - 0.55, { align: 'center', font: 0.5, opacity: 1 });

        if (creep.memory.targetRoom && creep.room.name !== creep.memory.targetRoom) {
            const targetRoom = creep.memory.targetRoom;
            const pos = new RoomPosition(25, 25, targetRoom);
            creepMovement.moveTo(creep, pos, { reusePath: 20, visualizePathStyle: { stroke: '#ff00ff' } });
            return;
        }

        if (Array.isArray(creep.memory.routeRooms) && creep.memory.routeRooms.length > 0) {
            const nextRoom = creep.memory.routeRooms[0];
            if (creep.room.name !== nextRoom) {
                const pos = new RoomPosition(25, 25, nextRoom);
                creepMovement.moveTo(creep, pos, { reusePath: 20, visualizePathStyle: { stroke: '#ff00ff' } });
                return;
            } else {
                creep.memory.routeRooms.shift();
            }
        }

        if (creep.memory.wall && creep.memory.wall.room === creep.room.name) {
            const wallPos = new RoomPosition(creep.memory.wall.x, creep.memory.wall.y, creep.memory.wall.room);
            const structs = wallPos.lookFor(LOOK_STRUCTURES);
            const wall = structs && structs.find(s => s.structureType === STRUCTURE_WALL || s.structureType === STRUCTURE_RAMPART);
            if (wall) {
                let res = creep.dismantle(wall);
                if (res === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, wall, { reusePath: 10, visualizePathStyle: { stroke: '#ff8800' } });
                } else if (res === ERR_INVALID_TARGET) {
                    if (creep.attack(wall) === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, wall, { reusePath: 10, visualizePathStyle: { stroke: '#ff0000' } });
                    }
                }
                return;
            }
        }

        let target = null;
        let hostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS);
        target = creep.pos.findClosestByPath(hostileCreeps.filter(c => 
            c.getActiveBodyparts(ATTACK) > 0 || c.getActiveBodyparts(RANGED_ATTACK) > 0
        ));

        if (!target) {
            target = creep.pos.findClosestByPath(FIND_HOSTILE_SPAWNS);
        }
        if (!target) {
            target = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS);
        }
        if (!target) {
            target = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES);
        }

        if (target) {
            if (creep.attack(target) === ERR_NOT_IN_RANGE) {
                creepMovement.moveTo(creep, target, { reusePath: 10, visualizePathStyle: { stroke: '#ff0000' } });
            }
        } else {
            creepMovement.moveTo(creep, new RoomPosition(25, 25, creep.room.name), { reusePath: 20 });
        }
    }
};

module.exports = roleAttacker;
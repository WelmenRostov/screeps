const creepMovement = require('./creepMovement');

let roleRat = {
    run: function(creep) {
        let homeRoom = creep.memory.homeRoom || creep.room.name;
        let targetRoom = creep.memory.targetRoom;
        let homePos = new RoomPosition(24, 46, homeRoom);

        if (!creep.memory.state) {
            creep.memory.state = 'approach';
        }

        if (creep.memory.state === 'approach') {
            if (!targetRoom) {
                creepMovement.moveTo(creep, homePos, { reusePath: 10, visualizePathStyle: { stroke: '#00ff00' } });
                return;
            }

            let approachPos;
            if (creep.memory.targetPos) {
                let tp = creep.memory.targetPos;
                let x = Math.max(2, Math.min(47, tp.x));
                let y = Math.max(2, Math.min(47, tp.y));
                approachPos = new RoomPosition(x, y, tp.roomName || targetRoom);
                creep.memory.attackPos = { x, y, roomName: approachPos.roomName };
            } else if (creep.memory.attackPos) {
                let ap = creep.memory.attackPos;
                approachPos = new RoomPosition(ap.x, ap.y, ap.roomName || targetRoom);
            } else {
                approachPos = new RoomPosition(25, 25, targetRoom);
            }

            if (creep.room.name !== targetRoom) {
                creepMovement.moveTo(creep, approachPos, { range: 3, reusePath: 15, visualizePathStyle: { stroke: '#ffaa00' } });
                return;
            }

            if (creep.pos.x === 0 || creep.pos.x === 49 || creep.pos.y === 0 || creep.pos.y === 49) {
                creepMovement.moveTo(creep, approachPos, { range: 3, reusePath: 5, visualizePathStyle: { stroke: '#ffaa00' } });
                return;
            }

            let target = getTarget(creep, approachPos);
            if (!target) {
                creepMovement.moveTo(creep, approachPos, { range: 3, reusePath: 5, visualizePathStyle: { stroke: '#ff0000' } });
                return;
            }

            let range = creep.pos.getRangeTo(target);
            if (range > 3) {
                creepMovement.moveTo(creep, target, { range: 3, reusePath: 5, visualizePathStyle: { stroke: '#ff0000' } });
                return;
            }

            if (creep.rangedAttack(target) === OK) {
                creep.memory.state = 'retreat';
                creep.memory.targetId = null;
            }
            return;
        }

        if (creep.memory.state === 'retreat') {
            if (creep.room.name !== homeRoom) {
                creepMovement.moveTo(creep, homePos, { reusePath: 10, visualizePathStyle: { stroke: '#ffaa00' } });
                return;
            }

            creep.memory.waitUntil = Game.time + 1;
            creep.memory.state = 'wait';
            return;
        }

        if (creep.memory.state === 'wait') {
            if (Game.time >= (creep.memory.waitUntil || 0)) {
                creep.memory.state = 'approach';
            } else {
                creepMovement.moveTo(creep, homePos, { reusePath: 10, visualizePathStyle: { stroke: '#00ff00' } });
            }
            return;
        }
    }
};

function getTarget(creep, focusPos) {
    if (creep.memory.targetId) {
        let cached = Game.getObjectById(creep.memory.targetId);
        if (cached && cached.hits !== undefined) {
            return cached;
        }
        creep.memory.targetId = null;
    }

    let hostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS);
    if (hostileCreeps.length > 0) {
        let enemy = creep.pos.findClosestByRange(hostileCreeps);
        if (enemy) {
            creep.memory.targetId = enemy.id;
            return enemy;
        }
    }

    if (focusPos) {
        let center = new RoomPosition(focusPos.x, focusPos.y, focusPos.roomName);
        let structures = center.lookFor(LOOK_STRUCTURES);
        let direct = structures.find(s => s.structureType === STRUCTURE_RAMPART) ||
                     structures.find(s => s.structureType === STRUCTURE_WALL) ||
                     structures[0];
        if (direct) {
            creep.memory.targetId = direct.id;
            return direct;
        }
    }

    let hostiles = creep.room.find(FIND_HOSTILE_STRUCTURES, {
        filter: s => s.structureType !== STRUCTURE_CONTROLLER
    });
    if (hostiles.length > 0) {
        let target = focusPos
            ? creep.pos.findClosestByRange(hostiles.filter(s => s.pos.getRangeTo(focusPos) <= 5)) || creep.pos.findClosestByRange(hostiles)
            : creep.pos.findClosestByRange(hostiles);
        if (target) {
            creep.memory.targetId = target.id;
            return target;
        }
    }

    return null;
}

module.exports = roleRat;


module.exports = {

    run() {
	let spawn = Game.spawns['Channy'];
	if (!spawn || spawn.spawning) return;

	let creeps = _.groupBy(Game.creeps, c => c.memory.role);

	if ((creeps['Mover'] || []).length < 2) {
	    let body = [];

	    body.push(...Array(2).fill(MOVE));
	    body.push(...Array(4).fill(CARRY));
	    return spawn.spawnCreep(
		body,
		`Mover_${Game.time}`,
		{ memory: { role: 'Mover' }}
	    );
	}
	if ((creeps['Nanny'] || []).length < 2) {
	    let body = [];

	    body.push(...Array(2).fill(MOVE));
	    body.push(...Array(4).fill(CARRY));
	    return spawn.spawnCreep(
		body,
		`Nanny_${Game.time}`,
		{ memory: { role: 'Nanny' }}
	    );
	}

	if ((creeps['LocalMiner'] || []).length < 1) {
	    let body = [];
	    body.push(...Array(3).fill(MOVE));
	    body.push(...Array(8).fill(WORK));
	    return spawn.spawnCreep(
		body,
		`LocalMiner_${Game.time}`,
		{ memory: { role: 'LocalMiner' }}
	    );
	}

	if ((creeps['Builder'] || []).length < 1) {
	    let body = [];

	    body.push(...Array(5).fill(CARRY));
	    body.push(...Array(5).fill(MOVE));
	    body.push(...Array(3).fill(WORK));
	    return spawn.spawnCreep(
		body,
		`Builder_${Game.time}`,
		{ memory: { role: 'Builder' }}
	    );
	}

	if ((creeps['Updater'] || []).length < 1) {
	    let body = [];

	    body.push(...Array(5).fill(CARRY));
	    body.push(...Array(6).fill(MOVE));
	    body.push(...Array(6).fill(WORK));
	    return spawn.spawnCreep(
		body,
		`Updater_${Game.time}`,
		{ memory: { role: 'Updater' }}
	    );
	}

	if ((creeps['Hauler'] || []).length < 1) {
	    let mySpawn = Game.spawns['Channy'];
	    let youSpawn = Game.spawns['Bob'];

	    let body = [];
	    body.push(...Array(11).fill(MOVE));
	    body.push(...Array(11).fill(CARRY));

	    let name = 'Hauler_' + spawn.name + '_' + Game.time;
	    return spawn.spawnCreep(body, name, { memory: { role: 'Hauler', mySpawn, youSpawn } });
	}

    }
}

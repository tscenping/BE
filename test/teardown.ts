import { dropDatabase } from 'typeorm-extension';
module.exports = async () => {
	console.log('\n\nSetup test environment');

	await global.databaseConfig.dropDatabase(true);
};

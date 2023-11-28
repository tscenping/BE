import { TestDBInitiator } from './config.e2e';
import * as dotenv from 'dotenv';

dotenv.config();

declare global {
	var databaseConfig: TestDBInitiator;
}

module.exports = async () => {
	console.log('\n\nSetup test environment');

	const databaseConfig = new TestDBInitiator();
	global.databaseConfig = databaseConfig;
	await databaseConfig.createDatabase();
};

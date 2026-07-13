import { DataManager } from "./DataManager";
import { MockDataManager } from "./MockDataManager";

export const dataManager: DataManager = MockDataManager.getInstance();

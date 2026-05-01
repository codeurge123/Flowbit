import { useContext } from "react";
import { AppContext } from "./appContext";

export const useApp = () => useContext(AppContext);

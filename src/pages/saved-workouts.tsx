import Header from '../components/Header';
import React from "react";
import SavedWorkouts from "../components/SavedWorkouts";

const SavedWorkoutsPage: React.FC = () => {
    return (
        <div>
            <Header/>
            <SavedWorkouts/>
        </div>
    );
};

export default SavedWorkoutsPage;
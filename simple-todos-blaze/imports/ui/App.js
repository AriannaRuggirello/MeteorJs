import { Template } from 'meteor/templating';
import { TasksCollection } from '../api/TasksCollection';
import { ReactiveDict } from 'meteor/reactive-dict';

import './App.html';
import './Task.js';
import './Login.js';

const getUser = () => Meteor.user();
const isUserLogged = () => !!getUser();

const getTasksFilter = () => {
    const user = getUser();

    const hideCompletedFilter = { isChecked: { $ne: true } };

    const userFilter = user ? { userId: user._id } : {};

    const pendingOnlyFilter = { ...hideCompletedFilter, ...userFilter };

    return { userFilter, pendingOnlyFilter };
}

// Quando il template chiamato "mainContainer" viene creato per la prima volta
Template.mainContainer.onCreated(function mainContainerOnCreated() {
    // Inizializza uno spazio di memoria speciale chiamato "state" per il template
    this.state = new ReactiveDict(); // Questo spazio di memoria gestisce dati reattivi
});

Template.mainContainer.helpers({
    tasks() {
        // Ottieni l'istanza corrente del template "mainContainer"
        const instance = Template.instance();

        // Ottieni lo stato corrente di "nascondi completati" dallo stato del template
        const hideCompleted = instance.state.get(HIDE_COMPLETED_STRING);

        const { pendingOnlyFilter, userFilter } = getTasksFilter();

        if (!isUserLogged()) {
            return [];
        }

        return TasksCollection.find(hideCompleted ? pendingOnlyFilter : userFilter, {
            sort: { createdAt: -1 }, // Ordina i task per data di creazione decrescente
        }).fetch(); // Converti il cursore in un array
    },

    // Questo helper restituisce lo stato corrente di "nascondi completati"
    hideCompleted() {
        return Template.instance().state.get(HIDE_COMPLETED_STRING);
    },

    // Mostra il numero di task incomplete
    incompleteCount() {
        if (!isUserLogged()) {
            return '';
        }

        const { pendingOnlyFilter } = getTasksFilter();

        const incompleteTasksCount = TasksCollection.find(pendingOnlyFilter).count();
        return incompleteTasksCount ? `(${incompleteTasksCount})` : '';
    },

    // Restituisce true se l'utente è loggato, altrimenti false
    isUserLogged() {
        return isUserLogged();
    }
});

// Gestisce l'evento di click sul pulsante "Nascondi completati"
const HIDE_COMPLETED_STRING = "hideCompleted";

Template.mainContainer.events({
    "click #hide-completed-button"(event, instance) {
        const currentHideCompleted = instance.state.get(HIDE_COMPLETED_STRING);

        instance.state.set(HIDE_COMPLETED_STRING, !currentHideCompleted);
    }
});

// Gestisce l'evento di sottomissione del modulo "task-form"
Template.form.events({
    "submit .task-form"(event) {
        // Evita il comportamento predefinito del browser di inviare il modulo
        event.preventDefault();

        // Prendi i valori dal form
        const target = event.target;
        const text = target.text.value;

        // Inserisci una nuova task nel database con i dati forniti
        TasksCollection.insert({
            text,
            userId: getUser()._id,
            createdAt: new Date(),
        });

        // Ripulisci il valore dell'input
        target.text.value = '';
    }
});

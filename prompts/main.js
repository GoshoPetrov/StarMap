const machine = {
  state: 'idle',

  transitions: {
    idle:    { FETCH: 'loading' },
    loading: { RESOLVE: 'success', REJECT: 'error' },
    success: { RESET: 'idle' },
    error:   { RESET: 'idle' },
  },

  send(event) {
    const next = this.transitions[this.state]?.[event];
    if (next) {
      console.log(`${this.state} → ${next}`);
      this.state = next;
    } else {
      console.warn(`No transition for ${event} in state ${this.state}`);
    }
  }
};

machine.send('FETCH');    // idle → loading
machine.send('RESOLVE'); // loading → success
machine.send('FETCH');   // ⚠ no transition (ignored safely)
machine.send('RESET');   // success → idle
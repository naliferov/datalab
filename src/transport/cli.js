export const parseCliArgs = cliArgs => {
    const args = {};
    let num = 0;

    for (let i = 0; i < cliArgs.length; i++) {
        if (i < 2) continue; //skip node and scriptName args

        let arg = cliArgs[i];
        args[num++] = arg;

        if (arg.includes('=')) {
            let [k, v] = arg.split('=');
            if (!v) {
                args[num] = arg; //start write args from main 0
                continue;
            }
            args[k.trim()] = v.trim();
        } else {
            args['cmd'] = arg;
        }
    }
    return args;
};
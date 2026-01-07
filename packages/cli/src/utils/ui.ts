import chalk from 'chalk';
import figlet from 'figlet';

/**
 * 模拟打字机效果
 * @param text 要显示的文本
 * @param delay 每字符延迟时间 (ms)
 * @param newline 是否在结束时换行
 */
export async function typewriter(text: string, delay: number = 15, newline: boolean = true) {
    for (const char of text) {
        process.stdout.write(char);
        if (delay > 0) {
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
    if (newline) {
        process.stdout.write('\n');
    }
}

/**
 * 显示 ASCII Logo
 */
export async function showLogo(text: string = 'Reborn UI') {
    return new Promise<void>((resolve) => {
        figlet.text(text, {
            font: 'Slant',
            horizontalLayout: 'default',
            verticalLayout: 'default',
            width: 80,
            whitespaceBreak: true
        }, async (err, data) => {
            if (err) {
                console.log(gradientText(text));
                resolve();
                return;
            }
            if (data) {
                const lines = data.split('\n');
                for (const line of lines) {
                    console.log(gradientText(line));
                    await new Promise(r => setTimeout(r, 20)); // 每行显示间隔，增加动感
                }
            }
            resolve();
        });
    });
}

/**
 * 带有样式的成功提示
 */
export function successLog(message: string) {
    console.log(`${chalk.green('✔')} ${message}`);
}

/**
 * 带有样式的警告提示
 */
export function warnLog(message: string) {
    console.log(`${chalk.yellow('⚠')} ${message}`);
}

/**
 * 带有样式的错误提示
 */
export function errorLog(message: string) {
    console.log(`${chalk.red('✘')} ${message}`);
}

/**
 * 渐变色文本 (简单模拟，不依赖第三方复杂渐变库)
 */
export function gradientText(text: string) {
    const colors = [
        chalk.hex('#FF0080'),
        chalk.hex('#FF8C00'),
        chalk.hex('#40E0D0'),
        chalk.hex('#0080FF'),
        chalk.hex('#7B68EE'),
    ];

    let result = '';
    for (let i = 0; i < text.length; i++) {
        const color = colors[i % colors.length];
        result += color!(text[i]);
    }
    return result;
}

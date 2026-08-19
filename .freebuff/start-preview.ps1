$logPath = 'D:\voskes\git\voskes.ir\.freebuff\preview-29bbc200-4777-4e16-80e3-54328e1edc4b.log'
$errorLogPath = "$logPath.err"

(Start-Process -FilePath 'npm.cmd' -ArgumentList 'run', 'dev' -RedirectStandardOutput $logPath -RedirectStandardError $errorLogPath -WindowStyle Hidden -PassThru).Id

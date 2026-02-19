Set UAC = CreateObject("Shell.Application")
UAC.ShellExecute "iniciar-mongodb-admin.bat", "", "", "runas", 1

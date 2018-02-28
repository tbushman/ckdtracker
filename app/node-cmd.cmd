@echo off & setlocal enableextensions
:: [node-cmd.cmd] Opens new Command Prompt with Node environment and PATH
::
:: LICENCE: MIT — https://opensource.org/licenses/MIT
::

setlocal enabledelayedexpansion

:: the following batch file only sets the environment and PATH.
call node-env.cmd

:: open a new command prompt window, with appropriate title.
setlocal
set PROMPT=[node] $p$_$g 
start "Node Environment" /D %NODE_ENV% cmd.exe /K "node ^-^-version"

:EXIT

endlocal
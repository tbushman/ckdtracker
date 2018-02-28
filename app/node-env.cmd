@echo off & setlocal enableextensions
:: [node-env.cmd] Sets Node environment and PATH only.
::
:: You can try commenting out the `HOME` variable setting. There is
:: some indication that node.exe might make/use an `etc` (settings) 
:: directory in the executable`s directory, if the `HOME` variable
:: does does not exist.
::
:: LICENCE: MIT — https://opensource.org/licenses/MIT
endlocal

:: get this batch file's directory, and strip trailing backslash.
:: all other paths are set relative to this variable.
set NODE_ENV=%~dp0
set NODE_ENV=%NODE_ENV:~0,-1%

:: set `HOME`, `HOMEPATH` and `NODE_PATH` variables.
set HOME=%NODE_ENV%
set HOMEPATH=%NODE_ENV%
set NODE_PATH=%NODE_ENV%\node_modules

:: set the REPLs history file location.
set NODE_REPL_HISTORY=%NODE_ENV%\.node_repl_history

:: prefix this directory to the `PATH` variable.
set PATH=%NODE_ENV%;%PATH%

:: change the prompt. (trailing space: `…$g `).
set PROMPT=[node] $p$_$g 


:EXIT
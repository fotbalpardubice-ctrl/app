# ML Work — lokální SQLite a HTTPS

Pro místní běh používá aplikace SQLite v souboru `.data/ml-work.sqlite`. PostgreSQL ani MySQL server není potřeba. Node.js obsahuje SQLite modul od verze 22.13; databázový soubor a tabulky se vytvoří lokálně. [Dokumentace Node.js pro SQLite](https://nodejs.org/api/sqlite.html).

Prohlížeč komunikuje pouze s Node.js serverem přes HTTPS. Přihlašovací účty a relace jsou v tabulkách `app_users` a `app_sessions`. Zakázky, zákazníci, materiál, pohyby skladu, dodací listy a jejich položky, faktury, docházka, žádosti a aktivita se zapisují do samostatných SQLite tabulek. Verzionovaný `app_state` současně drží obrazovkový snímek pro přehledy. Každá změna snímku a souvisejících tabulek se uloží v jedné databázové transakci.

Uživatelské účty zakládá správce ručně na stránce Uživatelé; veřejná žádost o přístup ani registrace nejsou zapnuté. Na stránkách zakázek, docházky, skladu, dodacích listů, fakturace, uživatelů a aktivity jsou importy a exporty CSV. CSV soubory používají české záhlaví, oddělovač čárkou nebo středníkem a u uživatelů je pro import potřeba sloupec s heslem alespoň 8 znaků. Účty jsou uloženy jako zabezpečené otisky hesel.

V přehledu zaměstnanců správce ukládá jméno, telefon, e-mail a výchozí hodinovou sazbu. Při přiřazení pracovníků k zakázce lze sazbu pro každého člověka nastavit samostatně; sazba zakázky se uloží spolu s přiřazením.

Ve skladu lze přes **Vyskladnit na zakázku** vytvořit jeden dodací list s libovolným počtem materiálových položek; každé množství se ověří a při uložení odečte. Odstranění dodacího listu smaže také jeho položky a vrátí množství do skladu. Pokud je k listu připojená faktura, správce odstranění faktury výslovně potvrdí.

Příchozí doklady lze smazat včetně jejich příloh; u potvrzeného příjmu na sklad se odečte přijaté množství. Smazání materiálu odstraní položku úplně včetně jejího zůstatku, skladových pohybů a výskytů na příjmových a výdejních dokladech. Připojené faktury zůstanou v evidenci.

## Spuštění ve Windows

1. Otevři PowerShell v této složce.
2. Spusť `npm.cmd run db:init`. Příkaz vytvoří lokální databázový soubor a tabulky.
3. Spusť `npm.cmd run db:create-admin`. Správce se vytvoří podle `INITIAL_ADMIN_EMAIL` a `INITIAL_ADMIN_PASSWORD` v místním `.env`; heslo musí mít alespoň 8 znaků a do databáze se uloží jako scrypt hash.
4. Spusť `npm.cmd start` a otevři [https://localhost:4173](https://localhost:4173).

Soubor `.env` obsahuje lokální cestu k SQLite, údaje správce a PFX pro HTTPS. `.env`, `.certs` a `.data` jsou ignorované Gitem. Databáze je soubor `.data/ml-work.sqlite`; pro zálohu aplikaci ukonči a zkopíruj tento soubor nebo použij export zálohy v aplikaci. Certifikát pro `localhost` je potřeba jednou přidat mezi důvěryhodné certifikáty aktuálního uživatele; lokální certifikát není určený pro veřejný web.

## Příjem dokladů

Automatické propojení s e-mailovou schránkou je vypnuté. Ve skladu lze ručně nahrát fakturu nebo dodací list ve formátu PDF, CSV či obrázku. Z CSV a textových PDF se aplikace pokusí předvyplnit údaje a položky; obrázky a naskenovaná PDF je třeba zkontrolovat a položky doplnit ručně. Nahrané doklady zůstanou ve frontě ke kontrole a do zásob se promítnou až po potvrzení správcem. Před potvrzením správce vybere centrální sklad či konkrétní zakázku. U přímého příjmu na zakázku se centrální sklad nezvýší.

Příchozí doklady se označí jako možné duplicity při shodě obsahu souboru nebo dodavatele a čísla dokladu. Čekající doklad lze smazat bez změny zásob. U potvrzeného příjmu na sklad se při smazání množství odečte zpět; pokud už bylo vydáno, aplikace smazání odmítne, aby sklad nespadl do nesouladu.

## Předloha faktury

V části Nastavení lze uložit údaje dodavatele, bankovní účet, splatnost, patičku a sazbu DPH. Nové faktury se počítají z prodejních cen v katalogu a používají uloženou předlohu; lze je vytisknout nebo uložit jako PDF z prohlížeče. Před vystavením skutečných faktur doplň správné firemní údaje a ověř nastavení DPH.

## GitHub a přístup ostatních

GitHub uchovává zdrojové soubory a jejich historii, ale nespouští tento Node.js server ani nesdílí lokální databázi. Tento repozitář proto zpřístupní kód ostatním; pro přístup do běžící aplikace přes internet je potřeba samostatný hosting a trvalá společná databáze. GitHub Pages pro tuto serverovou aplikaci nestačí. Přístupové údaje a místní databáze zůstávají v `.env` a `.data`, které jsou ignorované Gitem.

Tato konfigurace je vhodná pro lokální prototyp nebo jednu aplikaci na jednom serveru. Pro nasazení s více servery se později může přejít na PostgreSQL bez změny obrazovek aplikace.

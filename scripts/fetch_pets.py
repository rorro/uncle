import requests
import time

COLLECTIONLOG_API = 'https://api.collectionlog.net/collectionlog/user/'
output_file = '../../output.txt'


def main():
    clan_members = getClanMembers()
    with open(output_file, 'a') as f:
        for i in range(len(clan_members)):
            print('{}/{} {}'.format(i+1, len(clan_members), clan_members[i]))
            rsn = clan_members[i]
            response = requests.get(
                COLLECTIONLOG_API + rsn)

            if response.status_code != 200:
                continue

            try:
                collection_log = response.json()['collection_log']
                tabs = collection_log['tabs']
                all_pets = tabs['Other']['All Pets']['items']
                pluses = [
                    tabs['Raids']['Chambers of Xeric']['items'][1],
                    tabs['Raids']['Theatre of Blood']['items'][14],
                    tabs['Bosses']['The Nightmare']['items'][11],
                    tabs['Minigames']['Guardians of the Rift']['items'][13],
                    tabs['Minigames']['Hallowed Sepulchre']['items'][8]
                ]
                username = collection_log['username']

                obtained_pets = []
                for pet in all_pets:
                    if pet['obtained']:
                        obtained_pets.append(pet['name'])

                obtained_pluses = []
                for plus in pluses:
                    if plus['obtained']:
                        obtained_pluses.append(plus['name'])

                f.write('{}\nPets:{}: {}\nPluses:{}: {}\n\n'.format(
                    username, str(len(obtained_pets)), obtained_pets,
                    str(len(obtained_pluses)), obtained_pluses))
            except:
                print('Error?')
                continue


def getClanMembers():
    clan_members = []
    with open('../../members.txt', 'r') as f:
        for line in f:
            clan_members.append(line.lstrip().rstrip())
    return clan_members


main()
